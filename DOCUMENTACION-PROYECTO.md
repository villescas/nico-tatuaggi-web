# Documentación del proyecto

## Fix: error `NoAdapterInstalled` en el build de Astro

### Qué pasaba

`npm run build` fallaba con:

```
[NoAdapterInstalled] Cannot use server-rendered pages without an adapter.
```

La causa era [src/pages/index.astro](src/pages/index.astro): esa página lee headers de la request real (`accept-language`, y antes también `x-vercel-ip-country` / `x-netlify-geo`) y llama a `Astro.redirect()` para mandar al visitante a `/es` o `/en` según su idioma/país. Esa lógica no se puede resolver en build time (no existe una "request real" cuando Astro genera HTML estático), así que Astro exige renderizado on-demand (SSR) para esa ruta — y SSR requiere un adapter, que no estaba instalado.

Es la **única** página del sitio con esta necesidad: todo el resto (`/es/*`, `/en/*`) es contenido estático normal y se sigue generando como HTML en build time.

### Qué se cambió

1. **Adapter instalado:** `@astrojs/node@9.5.5` (versión compatible con `astro@^5.17.3`, que es la que usa este proyecto — la última versión de `@astrojs/node` requiere Astro 7 y no aplica acá).
2. **[astro.config.mjs](astro.config.mjs):** se agregó `adapter: node({ mode: 'standalone' })`, manteniendo `output: 'static'`. Esto activa el modo híbrido de Astro: todo prerenderiza como estático salvo las rutas que se marquen explícitamente como dinámicas.
3. **[src/pages/index.astro](src/pages/index.astro):** se agregó `export const prerender = false;` para marcar esta ruta puntual como on-demand. Además se eliminó la detección de país vía `x-vercel-ip-country` / `x-netlify-geo` (headers que solo existen en Vercel/Netlify y nunca se van a recibir en un VPS propio); ahora la detección de idioma es únicamente por el header estándar `accept-language`, que cualquier navegador/proxy envía sin configuración especial.

Resultado del build (`npm run build`):

```
[build] output: "static"
[build] mode: "server"
[build] adapter: @astrojs/node
...
prerendering static routes
  /en/faq/index.html, /en/galeria/index.html, /en/sobre-nico/index.html, /en/index.html
  /es/faq/index.html, /es/galeria/index.html, /es/sobre-nico/index.html, /es/index.html
[build] Server built in 5.74s
[build] Complete!
```

8 páginas siguen siendo estáticas puras; solo `/` (el redirect) queda como entrypoint de servidor en `dist/server/entry.mjs`.

### Cómo correr el servidor resultante en el VPS

El build genera dos carpetas:

- `dist/client/` — los assets estáticos (HTML, CSS, JS, imágenes) de las 8 páginas prerenderizadas.
- `dist/server/entry.mjs` — el servidor Node standalone que sirve esos estáticos **y** resuelve la única ruta dinámica (`/`).

En modo `standalone`, `@astrojs/node` levanta su propio servidor HTTP — no hace falta Express ni nada adicional. Se configura por variables de entorno:

- `PORT` — puerto de escucha (default `8080` si no se define).
- `HOST` — interfaz de escucha (default `0.0.0.0`).

Arranque manual (para probar):

```bash
cd /ruta/al/proyecto
PORT=4321 HOST=127.0.0.1 node ./dist/server/entry.mjs
```

#### Opción A: pm2

```bash
npm install -g pm2

# Desde la raíz del proyecto, después de hacer `npm run build`:
PORT=4321 HOST=127.0.0.1 pm2 start ./dist/server/entry.mjs --name nico-tatuaggi-web

pm2 save
pm2 startup   # genera el comando para que pm2 arranque solo en el boot del VPS
```

Comandos útiles: `pm2 restart nico-tatuaggi-web` (tras cada `npm run build` nuevo), `pm2 logs nico-tatuaggi-web`, `pm2 status`.

#### Opción B: systemd

Crear `/etc/systemd/system/nico-tatuaggi-web.service`:

```ini
[Unit]
Description=nico-tatuaggi-web (Astro SSR - Node standalone)
After=network.target

[Service]
Type=simple
WorkingDirectory=/ruta/al/proyecto
Environment=PORT=4321
Environment=HOST=127.0.0.1
ExecStart=/usr/bin/node /ruta/al/proyecto/dist/server/entry.mjs
Restart=on-failure
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nico-tatuaggi-web
sudo systemctl status nico-tatuaggi-web
```

Tras cada deploy (`git pull` + `npm run build`), reiniciar con `sudo systemctl restart nico-tatuaggi-web` (o el equivalente `pm2 restart`).

#### Nginx como reverse proxy

Cualquiera de las dos opciones corre en `127.0.0.1:4321` (o el puerto que definas), sin exponerse directamente a internet. Nginx (u otro proxy) se encarga de TLS y de reenviar el tráfico:

```nginx
location / {
    proxy_pass http://127.0.0.1:4321;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Esto asegura que el header `accept-language` (y cualquier otro header estándar del navegador) llegue intacto al proceso Node — es todo lo que necesita `index.astro` para decidir el idioma.
