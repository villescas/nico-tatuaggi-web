const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '.tmp', 'data.db'));

const hints = {
    'artist': 'Aquí modificas tu nombre, foto de perfil, biografía y puedes subir la galería de fotos cuadradas de tus viajes por el mundo.',
    'care': 'Esta es tu página de Aftercare. Puedes crear nuevos pasos (1. Lavado, 2. Crema, etc), asignarle un ícono, alerta roja/dorada y subirle su respectiva foto.',
    'city-request': '¡ATENCIÓN! No crees registros aquí manualmente. Aquí caen automáticamente los formularios que llena la gente en tu web pidiendo que vayas a su país.',
    'destination': 'Agrega cada viaje individualmente. Selecciona fecha de inicio y fin, ciudad, y el nombre del estudio invitado con su link. Se ordenan solos por fecha.',
    'faq': 'Añade preguntas y respuestas frecuentes para optimizar tu tiempo de respuesta con los clientes.',
    'popup': 'Prende o Apaga el popup central de noticias. Escribe un título y un subtítulo. Si no subes foto, el recuadro será pequeño y elegante.',
    'profile': 'Tu perfil general. Edita tu link de WhatsApp (ej: 5491112345678), Instagram Global, y sube el video MP4 de fondo (Hero Banner).',
    'tattoo': 'Sube tus trabajos. Etiquétalos como B&G o Color. IMPORTANTE: En el campo "Video URL" puedes pegar un link de Instagram Reel para que el video aparezca automáticamente en la web sin gastar memoria.'
};

try {
    const rows = db.prepare("SELECT * FROM strapi_core_store_settings WHERE key LIKE 'plugin_content_manager_configuration_content_types::api::%'").all();

    rows.forEach(row => {
        try {
            const val = JSON.parse(row.value);
            const ctParts = row.key.split('::')[2].split('.');
            const ctName = ctParts[0];
            
            let shouldUpdate = false;
            
            if (hints[ctName]) {
                const layoutEdit = val.layouts && val.layouts.edit;
                if (layoutEdit && layoutEdit.length > 0) {
                    for (let block of layoutEdit) {
                        if (block && block.length > 0 && block[0].name) {
                            const firstFieldName = block[0].name;
                            if (val.metadatas && val.metadatas[firstFieldName] && val.metadatas[firstFieldName].edit) {
                                val.metadatas[firstFieldName].edit.description = hints[ctName];
                                shouldUpdate = true;
                                break;
                            }
                        }
                    }
                }
            }
            
            if (shouldUpdate) {
                db.prepare("UPDATE strapi_core_store_settings SET value = ? WHERE id = ?").run(JSON.stringify(val), row.id);
                console.log(`Hint inyectado en ${ctName}`);
            }
        } catch(e) {
            console.error(`Error parsing row ${row.id}`, e);
        }
    });

    console.log("Inyección exitosa.");
} catch(e) {
    console.error("No se pudo acceder a la DB directamente", e);
}
