# Documentación del proyecto

## Redirect de idioma en `/`: por qué es 100% estático (y no SSR con Node)

### El problema original

`src/pages/index.astro` es la página que decide si mandar al visitante a `/es/` o `/en/`. La primera versión leía `Astro.request.headers.get('accept-language')` y llamaba a `Astro.redirect()` — lógica que depende de la request real, y que Astro solo puede resolver con renderizado on-demand (SSR). Como el proyecto no tenía ningún adapter instalado, el build fallaba con:

```
[NoAdapterInstalled] Cannot use server-rendered pages without an adapter.
```

### Intento descartado: adapter Node SSR

Se probó instalar `@astrojs/node` (modo `standalone`) y marcar `index.astro` con `export const prerender = false`, dejando el resto del sitio estático (modo híbrido de Astro). Esto **arregló el build**, pero se descartó por dos motivos concretos, encontrados al revisar cómo está desplegado el sitio en el VPS de producción:

1. **El deploy real no corre ningún proceso Node para el frontend.** En el VPS, nginx sirve `nicotatuaggi.com` como archivos estáticos puros desde `/var/www/html` (`try_files ... /index.html`), sin ningún `proxy_pass` hacia un servidor Node. El pipeline de deploy (`rebuild.sh`) solo hace `npm run build && cp -R dist/* /var/www/html/` — no levanta ni gestiona ningún proceso `node dist/server/entry.mjs`. Meter SSR acá hubiera significado sumar una pieza operativa nueva (proceso Node persistente vía pm2/systemd + reverse proxy en nginx) solo para resolver un redirect.
2. **Es innecesario para lo que hace falta.** La detección de idioma no necesita nada del servidor (geolocalización, cookies, sesión) — alcanza con lo que ya sabe el navegador: `navigator.language`. No hay ninguna razón real para pagar el costo operativo de SSR por esto.

### Solución actual: Opción C — redirect 100% del lado del cliente

`src/pages/index.astro` volvió a ser una página estática común (sin `prerender = false`, sin `Astro.request`, sin `Astro.redirect()`). Ahora es un HTML mínimo con un script inline que corre en el navegador:

```js
const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
const targetLang = lang.startsWith('es') ? 'es' : 'en';
window.location.replace(`/${targetLang}/`);
```

Regla: si el idioma del navegador empieza con `"es"` → `/es/`. Para cualquier otro caso (inglés, portugués, alemán, lo que sea) → `/en/` como default, porque es más probable que un visitante entienda inglés que español si no es explícitamente hispanohablante. Incluye un `<noscript>` con meta-refresh a `/en/` y links manuales por si el visitante tiene JS deshabilitado.

**`astro.config.mjs`** volvió a `output: 'static'` sin ningún `adapter`. Se sacó la dependencia `@astrojs/node` de `package.json`.

**Detalle no obvio que hubo que resolver:** con `i18n.routing.prefixDefaultLocale: true`, Astro genera automáticamente su propio redirect de `/` → `/{defaultLocale}` (vía meta-refresh, hardcodeado, sin mirar el idioma del navegador) y ese redirect **pisa cualquier `src/pages/index.astro` propio**, sin avisar ni tirar warning — el build simplemente ignoraba el contenido del archivo. Esto se resuelve agregando `redirectToDefaultLocale: false` dentro de `i18n.routing`, que le dice a Astro "no generes tu propio redirect en `/`, dejá que la use la página del usuario":

```js
i18n: {
  defaultLocale: "es",
  locales: ["es", "en"],
  routing: {
    prefixDefaultLocale: true,
    redirectToDefaultLocale: false
  }
}
```

### Verificación

`npm run build` compila 100% estático:

```
[build] output: "static"
[build] mode: "static"
...
[build] 9 page(s) built in 2.59s
[build] Complete!
```

Sin adapter, sin carpetas `dist/client` / `dist/server` — `dist/` queda plano (`index.html`, `es/`, `en/`, `_astro/`, favicons), compatible tal cual con el `try_files` estático que ya usa nginx en el VPS. Se probó además en el navegador: con `navigator.language = "en-US"` el redirect lleva correctamente a `/en/`.

### Colecciones vacías en Directus (contexto aparte, no relacionado a este fix)

De paso quedó registrado en una revisión anterior: `faq`, `faq_preguntas`, `news` y `news_files` están vacías en Directus — esas secciones del sitio corren hoy con contenido de fallback hardcodeado en el código, no con datos reales cargados en el panel.
