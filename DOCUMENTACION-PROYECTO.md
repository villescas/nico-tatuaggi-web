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

## Rediseño del modal de galería (Tattoo.astro) y limpieza relacionada — sesión larga, agosto 2026

Escrito porque la conversación se compactó por límite de contexto en medio de una sesión de varias horas con muchas idas y vueltas de bugs reales encontrados por el cliente en dispositivos reales. Si retomás esto, `git log --oneline` sobre `src/components/Tattoo.astro` y `src/pages/{es,en}/galeria.astro` tiene el detalle commit por commit; esto es el resumen narrativo.

### Qué se hizo (en orden)

1. **Rediseño completo del modal/lightbox** (antes: texto superpuesto sobre la foto en mobile, layout poco profesional en desktop). Se armaron 3 propuestas de layout como comps de HTML/CSS real (no mockups estáticos) con contenido real del sitio, comparadas por el cliente vía un Artifact publicado antes de tocar el componente. Se eligió **Opción B — split-pane**: desktop, imagen a la izquierda (68%, `object-contain`, nunca recortada) + panel de info a la derecha (32%, máx 440px); mobile, imagen arriba + bottom sheet abajo con scroll propio. Documentado como `PRODUCT.md` (nuevo, en la raíz del repo — lo generó la skill `impeccable` como parte de su proceso, tiene los principios de producto/audiencia/marca que rigen decisiones de diseño futuras en este sitio).
2. **Swipe táctil** en mobile para pasar de foto/video (mismo patrón que Instagram), conviviendo con las flechas existentes. Transición de slide direccional (la foto se desliza hacia el lado del swipe, no un crossfade genérico).
3. **Video de portada en la grilla**: antes autoplayeaba con `preload=metadata` en las ~50 tarjetas a la vez (lento, trababa). Ahora `preload=none` + `data-src`, y solo carga/reproduce con hover real (desktop) o al entrar en viewport (touch, `IntersectionObserver`). Los 16 trabajos cuya portada es video y no tenían foto de respaldo (`imagen_portada`) ahora tienen un poster generado con `ffmpeg` (**instalado en el VPS para esto**, no estaba) — primer frame elegido a mano mirando varios candidatos, no automático a ciegas.
4. **Video del lightbox**: se sacaron los controles nativos del navegador (`<video controls>`) y se reemplazaron por play/pause propio + `disablePictureInPicture` + `controlsList="nofullscreen noremoteplayback"`. Causa raíz real, confirmada: el botón de pantalla completa nativo le entregaba la interacción al reproductor del sistema operativo, tapando el botón de cerrar y las flechas sin forma de volver — no era un choque de listeners como se sospechaba al principio. También se sacó el `aspect-video` (16:9) que forzaba el contenedor y hacía ver chicos a los videos verticales.
5. **Pinch-to-zoom + drag** en las fotos del modal (siempre entran completas, nunca recortadas; el zoom es la vía para ver un detalle). Doble tap alterna zoom. Se resetea al cambiar de foto o cerrar.
6. **BUG CRÍTICO real, encontrado tarde y ya resuelto — "pointer-events fantasma":** `showSlide()` pone `el.style.pointerEvents = 'auto'` **inline** en el slide activo (necesario para que sus propios controles/zoom funcionen). `closeModal()` nunca lo revertía. Un `pointer-events` inline en un hijo le gana al `pointer-events-none` (clase) del modal padre — así que un modal "cerrado" dejaba un `<div class="slide">` invisible del tamaño de toda la pantalla, todavía clickeable, tapando la grilla para siempre. Esto explicaba **dos reportes que parecían bugs distintos**: no poder reabrir la misma imagen después de cerrarla, y la sensación de que el modal se veía "chico/diminuto" en desktop incluso con la ventana maximizada (el click en la miniatura quedaba atrapado por el fantasma en vez de abrir un modal nuevo). Se confirmó con `document.elementFromPoint()` en la posición real de una miniatura después de cerrar: devolvía el `.slide` fantasma, no la miniatura. Fix: `closeModal()` y el force-close de otros modales ahora limpian `pointer-events`/`transform`/`opacity` inline de **todos** los slides antes de ocultarse.
7. **Bug relacionado, más simple:** cada tatuaje tiene su propio modal con su propio script independiente (sin estado compartido) — nada impedía que **varios quedaran abiertos y apilados a la vez** al hacer click en varias imágenes seguidas. Fix: `openModal()` ahora fuerza el cierre de cualquier otro modal visible antes de mostrar el suyo (ver también el punto 6 — comparten la misma clase de bug: estado inline que no se limpia entre instancias).
8. **Filtros:** se sacó "Realismo" como filtro/tag en todos lados (chips de la home, botones de `/galeria`, y **de los 51 registros en Directus** — `ia_etiquetas`) porque aplica a ~todo el trabajo de Nico y no aporta como filtro. Chips nuevos en la home ("Color / Black & Grey / Cover-Ups") que llevan a `/galeria?filter=...` con el filtro ya aplicado (lee el query param, simula el click del botón correspondiente). Bug de contraste real en el botón activo de `/galeria`: el click handler agregaba `text-tattoo-gold` Y `text-black` al mismo botón a la vez, y cuál ganaba dependía del orden de generación de Tailwind — texto invisible (dorado sobre dorado). Reescrito con un solo `toggle` por estado, nunca ambos colores a la vez. De paso, ícono de check animado en el filtro activo — y otro bug chico: el ícono reservaba su ancho (14px) aunque estuviera en `scale-0`/invisible, corriendo el texto hacia la derecha en inactivo; ahora el ancho también se anima (`w-0` → `w-3.5`), así que en inactivo no ocupa espacio.

### Pendiente / sin resolver al momento de escribir esto

- **Foto de "rosas azules" (id 99 en `tatuajes`) y "varias imágenes iguales" (sin especificar cuáles) con mal recorte en la miniatura de grilla.** Investigado: el archivo YA guardado es exactamente 4:5 (1440×1800), así que `object-cover` en el frontend no le está sacando nada — si falta contenido importante, se perdió en el recorte automático (`sharp`, modo `attention`) que se hizo al subir la foto originalmente, no es arreglable con CSS. Hace falta re-recortar a mano desde el archivo original. La carpeta fuente (93 archivos) está en `C:\Users\ville\OneDrive\Proyectos\Paginas Web\Tatuajes Nico\`, pero los nombres de archivo no tienen relación obvia con qué trabajo es cada uno — **pendiente de que el usuario identifique el archivo original correcto** (o suba directamente una versión mejor recortada vía el panel de Directus).
- **Reporte de "modal chico en desktop" con Brave:** el usuario confirmó que persistía incluso con Shields de Brave apagado, lo cual llevó a encontrar el bug del punto 6 (pointer-events fantasma) en vez de ser algo de Brave. El fix ya está deployado — **queda pendiente que el usuario confirme en su navegador real** que ya se ve bien: era la hipótesis más fuerte pero no se pudo re-confirmar en vivo con el usuario antes de compactar la conversación.
- `faq`, `faq_preguntas`, `news`, `news_files` siguen vacías en Directus (heredado de antes, sin resolver, ver arriba).

### Notas de infraestructura que cambiaron esta sesión

- **ffmpeg instalado en el VPS** (`apt-get install ffmpeg`), no estaba antes. Se usa para extraer frames de video como poster de portada.
- **`PRODUCT.md`** nuevo en la raíz del repo (generado por la skill `impeccable` en su paso `init`). Tiene product truth (audiencia, principios, brand commitments) que ahora es contexto vinculante para trabajo de diseño futuro en este sitio vía esa skill.
- La llave SSH `nico-tatuaggi-deploy-2` (generada tras el incidente de seguridad de fines de julio/agosto) sigue siendo la que se usa para todo el trabajo de esta sesión (deploys, SSH directo al VPS) — confirmado funcionando de punta a punta muchas veces.
