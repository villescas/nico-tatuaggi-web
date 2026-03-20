const fs = require('fs');
const path = require('path');

const schemas = {
    'artist': {
        displayName: '1. El Artista (Biografía)',
        description: 'Aquí modificas tu foto de perfil, cronología y fotos de tus viajes por el mundo.'
    },
    'care': {
        displayName: '5. Cuidados (Aftercare)',
        description: 'Sección para agregar o modificar los pasos de curación del tatuaje.'
    },
    'city-request': {
        displayName: '7. Pedidos de Ciudades',
        description: 'ATENCIÓN: Aquí llegan automáticamente los pedidos del formulario web. NO CREAR MANUALMENTE.'
    },
    'destination': {
        displayName: '4. Próximos Destinos',
        description: 'Tus próximas fechas de viaje. Agrega la ciudad, el estudio y tu link de Instagram asociado.'
    },
    'faq': {
        displayName: '6. Preguntas Frecuentes',
        description: 'Preguntas y respuestas acordes a tu workflow para filtrar dudas básicas.'
    },
    'popup': {
        displayName: '3. Anuncio / Popup',
        description: 'Activa o desactiva el anuncio flotante (Breaking News) en la página principal.'
    },
    'profile': {
        displayName: '2. Perfil y Contacto',
        description: 'Tu perfil general. Edita tu nombre, Avatar, link de WhatsApp e Instagram Global, y el video de fondo (Hero).'
    },
    'tattoo': {
        displayName: '8. Trabajos (Portfolio)',
        description: 'Tu galería principal. Sube fotos, videos (Reels) y etiquétalos por estilo (Realismo, Color, etc).'
    }
};

const baseDir = path.join(__dirname, 'src', 'api');

for (const [folder, data] of Object.entries(schemas)) {
    const schemaPath = path.join(baseDir, folder, 'content-types', folder, 'schema.json');
    if (fs.existsSync(schemaPath)) {
        const fileContent = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        
        fileContent.info.displayName = data.displayName;
        fileContent.info.description = data.description;
        
        fs.writeFileSync(schemaPath, JSON.stringify(fileContent, null, 2));
    } else {
        console.warn(`No se encontró el schema en: ${schemaPath}`);
    }
}

console.log('Schemas actualizados con nombres y descripciones en español exitosamente!');
