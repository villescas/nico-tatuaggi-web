# Bitácora del proyecto — Nico Tatuaggi Web

Última actualización: 2026-08-01. Escrita porque se va a restaurar/formatear la compu de trabajo — esto es lo que hay que saber para retomar sin perder contexto.

## 1. Qué es esto

Sitio Astro (estático) + Directus headless CMS para el portfolio de Nico Tatuaggi (tatuador, Buenos Aires / Glasgow). Repo: `nico-tatuaggi-web`.

- **Frontend**: Astro, Tailwind, deploy estático.
- **CMS**: Directus self-hosted en `https://panel.nicotatuaggi.com` (VPS `200.58.127.97`).
- **Repos remotos**:
  - `origin` → `https://github.com/villescas/nico-tatuaggi-web.git` (GitHub, backup de código)
  - `produccion` → `ssh://root@200.58.127.97/var/repo/portfolio.git` (deploy vía git push)
- **n8n** (automatización RSS→noticias): `https://n8n.nicotatuaggi.com/workflow/lsW3k7nn4j9SvkR3` — workflow armado y probado, **queda inactivo** (no se activó formalmente). Pendiente decidir si se activa.

## 2. Qué se hizo en esta sesión larga (resumen técnico)

### a) Schema nuevo en Directus (colección `tatuajes`)

La colección `tatuajes` originalmente solo soportaba **un** archivo por trabajo (`archivo_local`). Se amplió a galería múltiple sin romper lo viejo:

- **`tatuajes_files`** (nueva colección, junction M2M): `id`, `tatuajes_id` (FK→tatuajes), `directus_files_id` (FK→directus_files). Sin campo `sort` — el orden de la galería es el orden de inserción de las filas.
- **`tatuajes.archivos`** (nuevo campo alias, `type: files`): la galería real (fotos/video) que usa el frontend. Reemplaza en la práctica a `archivo_local`, que se dejó intacto como legado/no se borró.
- **`tatuajes.en_proceso`** (nuevo campo boolean, default `false`): para marcar trabajos recién hechos / en curación, **separado** de `ia_etiquetas` (que es solo estilo: Realismo, Color, Black and Grey, Cover Up).

Todo esto se hizo con el patrón ya existente de `news_files` (mismo diseño de junction).

### b) Frontend (`src/components/Tattoo.astro`, `src/pages/{es,en}/galeria.astro`)

- `Tattoo.astro` ahora arma un carrusel real (flechas prev/next + contador "1/N") cuando `galeria.length > 1`. Si no hay galería, cae al modo legado (un solo archivo / video de YouTube / Instagram) — nada se rompió para datos viejos.
- Thumbnail de grilla: `aspect-square` → **`aspect-[4/5]`**.
- Nuevo badge (esquina superior izquierda, dorado) cuando `en_proceso = true`: "En Curación" (ES) / "Healing" (EN). Los textos se pasan como prop desde cada página de galería (mismo patrón que `readMoreText` en `NewsCard`), el componente no hace i18n propio.
- `galeria.astro` (es/en) piden `archivos.directus_files_id.id,archivos.directus_files_id.type` y `en_proceso` a Directus, arman `galeria[]` client-side (detectan video por MIME `video/*`) y las pasan al componente.
- Todo esto está **commiteado y pusheado a `origin/main`** (commit `d0949bc`). **No** se hizo `git push produccion` todavía — el deploy a producción queda pendiente de tu confirmación.

### c) Pipeline de carga de fotos/videos del portfolio

Carpeta fuente (**fuera del repo git**, ver advertencia en sección 5): `C:\Users\ville\Proyectos\Paginas Web\Tatuajes Nico\` — 93 archivos originales (fotos+videos) de WhatsApp/cámara, nunca modificados.

Proceso por cada trabajo: inspección visual obligatoria (nunca agrupar solo por timestamp) → clasificación (color/B&N, cover-up sí/no) → caption con humor/confianza en español, **sin nombrar celebridades reales** (se puede referenciar el personaje/película/serie, no a la persona real) → fotos recortadas a **4:5** con `sharp` (`fit:cover, position:attention`, WebP calidad 82) → videos comprimidos con `ffmpeg` (`scale min(720,iw), libx264 crf 26, aac 128k, faststart`) → subida a Directus (`POST /files`, **importante pasar `;type=image/webp` o `;type=video/mp4` explícito en el curl**, si no Directus a veces guarda `application/octet-stream`) → `create-item` en `tatuajes` (`visible:false`, `sede:"Buenos Aires"`) → una fila en `tatuajes_files` por archivo, en orden **video primero, fotos después**.

## 3. Estado completo en Directus — 103 trabajos (`tatuajes` ids 53-103)

Todos con `sede: "Buenos Aires"`. **Todos `visible:false`** excepto los ids 53-62 (tanda 1, ya publicados en su momento). Falta la revisión final de Nico/Esteban antes de poner `visible:true` en el resto.

| ID | Tema (resumen) | Tags | en_proceso |
|----|----|----|----|
| 53 | Llave → kayak/montaña (cover-up) | Realismo, Color, Cover Up | |
| 54 | Boceto → ícono del rock (cover-up) | Realismo, Color, Cover Up | |
| 55 | Boceto → trofeo River (cover-up) | Realismo, Color, Cover Up | |
| 56 | Dragón → león (cover-up) | Realismo, B&N, Cover Up | |
| 57 | Sombrerero Loco | Realismo, Color | |
| 58 | Hibisco (proceso→final) | Realismo, Color | |
| 59 | Retoque ícono fútbol | Realismo, Color | |
| 60 | Camaleón | Realismo, Color | |
| 61 | Pug | Realismo, B&N | |
| 62 | Basquetbolista Heat | Realismo, Color | |
| 63 | Jugador Argentina, manitos corazón | Realismo, Color | |
| 64 | Ángel guerrero (video+foto) | Realismo, B&N | |
| 65 | Retrato "Sofía" (video+2 fotos) | Realismo, Color | |
| 66 | Demonio colmillos | Realismo, Color | |
| 67 | Perra "Almendra" (2 fotos) | Realismo, Color | |
| 68 | T-Rex | Realismo, Color | |
| 69 | Anubis (video+foto) | Realismo, B&N | |
| 70 | Rayas geométricas | B&N | |
| 71 | Criatura cabra/carnero | Realismo, B&N | |
| 72 | Rombo geométrico | B&N | |
| 73 | **Serpiente** (video+film aún fresca) | Realismo, Color | **true** |
| 74 | San Benito + cuervo | Realismo, B&N | |
| 75 | Ídolo fútbol arg. besando la copa (s/n) | Realismo, Color | |
| 76 | Leon S. Kennedy / videojuego | Realismo, B&N | |
| 77 | Cantante rock gritando (s/n, 2 fotos) | Realismo, Color | |
| 78 | Arcángel Miguel vs demonio | Realismo, B&N | |
| 79 | Guerrero arena/Coliseo (s/n) | Realismo, Color | |
| 80 | Bruja + gato negro | Realismo, Color | |
| 81 | Retrato de bebé | Realismo, Color | |
| 82 | Comediante señalando, bandera Arg. (s/n) | Realismo, Color | |
| 83 | Tribal → pulpo rojo (cover-up, 2 fotos) | Realismo, Color, Cover Up | |
| 84 | Guerrero escocés / pintura guerra (s/n) | Realismo, B&N | |
| 85 | Comediante serie TV (s/n, 2 video+1 foto) | Realismo, Color | |
| 86 | Pintura oscura, figura bebiendo sangre | Realismo, Color | |
| 87 | Rockstar 70s (s/n, 2 videos mismo trabajo) | Realismo, B&N | |
| 88 | Caballero templario + tribal | Realismo, Color | |
| 89 | Basquetbolista "Three-peat" Bulls 91-93 | Realismo, B&N | |
| 90 | Camafeo Art Nouveau | Realismo, B&N | |
| 91 | Antihéroe máscara roja + murciélago | Realismo, Color | |
| 92 | **Payaso siniestro** (video en pleno proceso) | Realismo, Color | **true** |
| 93 | Guitarrista veterano rock (s/n) | Realismo, B&N | |
| 94 | Venom (personaje ficticio, ok referenciar) | Realismo, Color | |
| 95 | Jugador ídolo Liverpool FC (s/n) | Realismo, Color | |
| 96 | Ídolo fútbol arg. sonriente (s/n) | Realismo, Color | |
| 97 | Ídolo fútbol arg. de espaldas + copa (s/n) | Realismo, Color | |
| 98 | Basquetbolista lengua afuera, 90s (s/n) | Realismo, Color | |
| 99 | Rosas azules | Realismo, Color | |
| 100 | Copa del Mundo sola | Realismo, Color | |
| 101 | Rockstar galera en llamas (s/n) | Realismo, Color | |
| 102 | Cabaña + fogata + aurora boreal | Realismo, Color | |
| 103 | León enseñándole al cachorro | Realismo, B&N | |

`(s/n)` = inspirado en una persona real pero **sin nombrarla** en el caption, por regla explícita del proyecto.

## 4. Pendiente / próximos pasos

1. **Revisión final de Nico/Esteban** de los 103 trabajos → decidir cuáles pasan a `visible:true`. Ahora mismo solo 53-62 son públicos.
2. **Ítem #57 (Sombrerero Loco)**: la foto `23632871-F3E6-4BD7-A554-ECDAAE5E9E6D.jpeg` se sumó como foto adicional a su galería, pero queda **pendiente de confirmación visual de Nico/Esteban** de que es la misma obra.
3. **Deploy a producción**: el cambio de galería multi-archivo + badge está en GitHub (`origin/main`) pero **no** se pusheó a `produccion` todavía. Falta decidir cuándo.
4. **n8n**: workflow de noticias armado y probado, queda inactivo. Hay una anomalía sin resolver del todo (una corrida en vivo dio 9EN/1ES en vez del 5EN/5ES esperado) — no bloqueante, pero si se activa conviene vigilar la primera corrida real.
5. Decidir si se quiere reprocesar/mejorar la foto de la serpiente (#73) o el video del payaso (#92) una vez que esos trabajos terminen de sanar — hoy están marcados `en_proceso:true` a propósito.

## 5. Excluidos del portfolio (no subidos, quedan en la carpeta fuente)

- `video-output-75C9D091-32BB-4767-A15B-C25FD1D196EE-1.mov` — dragón/kaiju con **marca de agua de otro estudio** ("DGN...TATTOO"). **No subir sin confirmación de Nico.**
- `9038840A-4820-4547-8418-195680FC38E9.jpg`, `IMG_3672.PNG`, `9931aebe-28ff-4f58-b246-6caed851841d.jpg` — sin contexto claro de trabajo terminado.
- `IMG_8390.MOV` — footage callejero de Glasgow, no es un tatuaje.
- `IMG_3509.mov`, `IMG_3513.mov` — proceso sin terminar.
- `46eb67d0463b46aa9aad5b99e4c906d1.mp4` — tatuaje viejo no relacionado, aparece de fondo en un clip casual.
- `WhatsApp Video ... 20.14.39.mp4` — borroso, sin contexto.
- `318a91e9500a40af8a62136416fffca7.mov` — solo stencil, sin terminar.
- `WhatsApp Image ... 20.14.47.jpeg` — duplicado de la foto de Anubis (#69), no hacía falta.
- `WhatsApp Image ... 20.14.48.jpeg` — duplicado de peor calidad de la Copa del Mundo (#100), se usó `20.14.48.1.jpeg`.
- `IMG_0253(1).jpg` — probable duplicado exacto de `IMG_0253.jpg` (usado en #65).
- `b46b2e9bf77247a4ba692b5442de9fe2(1).mov` — duplicado exacto (mismo MD5) de `b46b2e9bf77247a4ba692b5442de9fe2.mov` (usado en #85).

## 6. ADVERTENCIAS antes de restaurar la compu

⚠️ **`C:\Users\ville\Proyectos\Paginas Web\Tatuajes Nico\`** (93 archivos originales) **NO está en git, no tiene backup**. Si se formatea sin copiar esta carpeta a otro lado (disco externo, nube), se pierden los originales para siempre — solo quedarían las versiones ya comprimidas/recortadas que están subidas a Directus (que sí son recuperables desde `panel.nicotatuaggi.com`). Recomendado: copiarla a OneDrive/Google Drive/disco externo antes de formatear.

⚠️ **Token de administrador de Directus**: vive en la config global de Claude Code (`~/.claude.json`, fuera de este repo), **no en este archivo ni en git**. Se pierde con el perfil de usuario al restaurar. Después de reinstalar, hay que reconfigurar el MCP server de Directus (URL: `https://panel.nicotatuaggi.com`) con un token nuevo o el mismo si lo guardaste aparte. Ver `CREDENCIALES_LOCAL.md` en este mismo repo (ignorado por git, **cópialo a otro lado si lo necesitás**, no va a sobrevivir el restore).

⚠️ El contenido de Directus (los 103 registros, las 93+ imágenes/videos ya subidos) **vive en el servidor** (`panel.nicotatuaggi.com` / VPS `200.58.127.97`), no en esta compu — eso está a salvo pase lo que pase acá.

## 7. Cómo retomar

1. Cloná el repo de nuevo (`git clone https://github.com/villescas/nico-tatuaggi-web.git`) — ya tiene todo lo de este archivo commiteado.
2. Reconfigurá el MCP de Directus (ver advertencia arriba).
3. Si vas a seguir subiendo trabajos: la carpeta fuente `Tatuajes Nico\` tiene que volver a estar en `C:\Users\ville\Proyectos\Paginas Web\Tatuajes Nico\` (o ajustá las rutas).
4. `npm install` y listo para seguir.
