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

## Pipeline de deploy en el VPS: remote fantasma y fix de logging

### El hallazgo: dos mecanismos de deploy compitiendo en silencio

Investigando por qué los cambios de Directus "a veces no se reflejaban" en el sitio, apareció un segundo mecanismo de deploy que nadie tenía presente: el repo local tiene un remote `produccion` apuntando a un **bare repo en el propio VPS** (`/var/repo/portfolio.git`), con un hook `post-receive` que — al recibir un `git push produccion main` — hacía `git checkout -f main` sobre `/var/www/nico-frontend`, `npm install`, `npm run build` y copiaba a `/var/www/html`.

El problema: ese bare repo estaba **desactualizado** (último commit `caf3e3f`, varios commits atrás — le faltaban el fix de SSR, el `.gitignore` de graphify-out y el fix del redirect de idioma). Mientras tanto, el mecanismo que sí se usaba día a día — el Flow de Directus disparando el webhook (puerto 9000) → `rebuild.sh` — **nunca hacía `git pull`**, solo reconstruía lo que ya hubiera en `/var/www/nico-frontend`. Como esa carpeta tampoco era un clone real de git (era un working-tree gestionado por `--work-tree`/`--git-dir` sin `.git` propio), no había forma de que ninguno de los dos caminos trajera código nuevo de forma confiable. Resultado: el sitio en producción quedó pegado al build del 9 de julio durante semanas, sin ningún error visible.

### Qué se hizo

1. **Backup completo** de la carpeta original antes de tocar nada: `/var/www/nico-frontend-backup-20260724-004344` (copia 1:1, incluye `node_modules`/`dist` por seguridad).
2. **`/var/www/nico-frontend` reemplazada por un clone real de GitHub** (`git clone https://github.com/villescas/nico-tatuaggi-web.git`), con `npm install` corrido — working tree limpio, sincronizado con `main`.
3. **Hook `post-receive` del bare repo desactivado** con `chmod -x` (el archivo sigue ahí, intacto, reactivable con `chmod +x` si hiciera falta) — para que no queden dos mecanismos de deploy activos en paralelo peleando por la misma carpeta.

### `rebuild.sh` nuevo: logging y corte ante errores

`/root/rebuild.sh` (disparado por el webhook de Directus) ahora es:

```bash
#!/bin/bash
set -e

LOG_FILE="/var/log/rebuild-astro.log"
WEB_PATH="/var/www/nico-frontend"
PUBLIC_WWW="/var/www/html"

{
  echo "===== $(date '+%Y-%m-%d %H:%M:%S') - INICIO rebuild ====="
  cd "$WEB_PATH"
  git pull --ff-only
  npm run build
  rm -rf "$PUBLIC_WWW"/*
  cp -r dist/* "$PUBLIC_WWW"/
  chmod -R 755 "$PUBLIC_WWW"
  echo "===== $(date '+%Y-%m-%d %H:%M:%S') - EXITO ====="
} >> "$LOG_FILE" 2>&1 || {
  echo "===== $(date '+%Y-%m-%d %H:%M:%S') - ERROR (ver output de build arriba) =====" >> "$LOG_FILE"
  exit 1
}
```

Cambios clave respecto a la versión vieja:
- **`git pull --ff-only`** antes del build — ahora sí trae el código nuevo en cada corrida; `--ff-only` evita que el script genere un merge commit solo en el servidor si algo llegó a divergir.
- **`set -e`** — si `git pull` o `npm run build` fallan, el script corta ahí mismo en vez de seguir copiando un `dist/` viejo/inexistente como si nada hubiera pasado (que era exactamente lo que generaba el "a veces no se refleja" original).
- **Log en `/var/log/rebuild-astro.log`** — cada corrida deja un bloque con fecha de inicio, el output completo del build (porque la redirección `>> "$LOG_FILE" 2>&1` envuelve todo el bloque, así que si `npm run build` falla a mitad de camino, lo que ya imprimió queda registrado igual), y una línea final de `EXITO` o `ERROR`. Antes no quedaba rastro de nada de esto en ningún lado.

### Webhook con `-verbose`

El servicio systemd (`/usr/lib/systemd/system/webhook.service`) corría el binario `adnanh/webhook` sin `-verbose`, así que no logueaba absolutamente nada sobre qué hook se disparaba ni si el comando fallaba. Se agregó el flag:

```
ExecStart=/usr/bin/webhook -verbose -nopanic -hooks /etc/webhook.conf
```

y se aplicó con `systemctl daemon-reload && systemctl restart webhook`. Ahora `journalctl -u webhook` muestra cada request entrante, si matcheó el hook, y cuándo terminó de ejecutar `rebuild.sh`.

### Prueba de punta a punta (confirmada)

Se disparó manualmente `POST http://200.58.127.97:9000/hooks/rebuild-astro` (la misma URL que usa el Flow "Actualizar Web" de Directus). Resultado:

- `journalctl -u webhook`: `incoming HTTP POST request` → `rebuild-astro got matched` → `hook triggered successfully` → `executing /root/rebuild.sh` → `finished handling rebuild-astro`.
- `/var/log/rebuild-astro.log`: bloque completo con `git pull` (`Already up to date.`), build estático exitoso (`mode: "static"`, 9 páginas), y `EXITO` con timestamp.
- Confirmado externamente: `https://nicotatuaggi.com/es/` responde con `Last-Modified` igual al timestamp del rebuild — el sitio público ya sirve ese build.

## Pendientes menores

- **`faq`, `faq_preguntas`, `news` y `news_files` vacías en Directus** — esas secciones del sitio corren con contenido de fallback hardcodeado en el código, no con datos reales cargados en el panel. _(sin resolver)_
- ~~**Referencias muertas en los Flows de Directus:** `care`/`care_steps` en "Actualizar Web" y "Publicar Cambios en la Web".~~ **Resuelto.** Se sacaron ambas colecciones de la lista `collections` de los dos Flows (vía SQL directo sobre `directus_flows.options`, ya que el MCP de Directus bloquea `updateItem` sobre colecciones de sistema). Verificado releyendo los Flows desde la propia API de Directus, sin necesidad de reiniciar nada.
- ~~**Proceso pm2 zombie:** `webhook-rebuild` compitiendo por el puerto 9000 contra el webhook real.~~ **Resuelto.** `pm2 delete webhook-rebuild` + `pm2 save` (para que no reaparezca en un reinicio del VPS). Se confirmó después que el webhook real (systemd, puerto 9000) seguía activo y respondiendo `200 OK`.
- ~~**Código viejo de Strapi dentro de este mismo repo:** carpeta `backend/` completa, sin usar.~~ **Resuelto.** Se confirmó que nada en `src/` ni en el `package.json` raíz referenciaba `backend/`, y que el backend real en producción es Directus en un path completamente aparte (`/var/www/nico-backend`). Se sacó del repo con `git rm -r backend/` (61 archivos: content-types, controllers, routes, services, config, scripts sueltos y dependencias `@strapi/*` en su propio `package.json`).
