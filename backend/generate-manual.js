const fs = require('fs');
const path = require('path');

const schemaName = 'manual';
const apiDir = path.join(__dirname, 'src', 'api', schemaName);

['content-types', 'controllers', 'routes', 'services'].forEach(folder => {
    if (folder === 'content-types') {
        fs.mkdirSync(path.join(apiDir, folder, schemaName), { recursive: true });
    } else {
        fs.mkdirSync(path.join(apiDir, folder), { recursive: true });
    }
});

const schemaContent = {
    kind: 'singleType',
    collectionName: 'manuals',
    info: { 
        singularName: 'manual', 
        pluralName: 'manuals', 
        displayName: '0. MANUAL (LEER AQUÍ)', 
        description: 'Guía de uso del panel' 
    },
    options: { draftAndPublish: false },
    pluginOptions: {},
    attributes: {
        intro: { 
            type: 'text', 
            default: '¡Bienvenido a tu nueva terminal de control Nico! Lee las instrucciones a continuación para entender cada sección del menú izquierdo.' 
        },
        el_artista: { 
            type: 'text', 
            default: 'Aquí modificas tu nombre, foto de perfil, biografía y puedes subir la galería de fotos cuadradas de tus viajes por el mundo.' 
        },
        perfil: { 
            type: 'text', 
            default: 'Tu perfil general. Edita tu link de WhatsApp (ej: 5491112345678), Instagram Global, y sube el video MP4 de fondo (Hero Banner).' 
        },
        anuncio_popup: { 
            type: 'text', 
            default: 'Prende o Apaga el popup central de noticias. Escribe un título y un subtítulo. Si no subes foto, el recuadro será pequeño y elegante. Si subes foto, tapará la pantalla con la misma.' 
        },
        proximos_destinos: { 
            type: 'text', 
            default: 'Agrega cada viaje individualmente. Selecciona fecha de inicio y fin, ciudad, y el nombre del estudio invitado con su link. Se ordenan solos por fecha.' 
        },
        cuidados: { 
            type: 'text', 
            default: 'Esta es tu página de Aftercare. Puedes crear nuevos pasos (1. Lavado, 2. Crema, etc), asignarle un ícono, alerta roja/dorada y subirle su respectiva foto.' 
        },
        preguntas_faq: { 
            type: 'text', 
            default: 'Añade preguntas y respuestas frecuentes para optimizar tu tiempo de respuesta con los clientes.' 
        },
        pedidos_ciudades: { 
            type: 'text', 
            default: '¡ATENCIÓN! No crees registros aquí manualmente. Aquí caen automáticamente los formularios que llena la gente en tu web pidiendo que vayas a su país.' 
        },
        portfolio_tatuajes: { 
            type: 'text', 
            default: 'Sube tus trabajos. Etiquétalos como B&G o Color. IMPORTANTE: En el campo "Video URL" puedes pegar un link de Instagram Reel para que el video aparezca automáticamente en la web sin gastar memoria de servidor.' 
        }
    }
};

fs.writeFileSync(
    path.join(apiDir, 'content-types', schemaName, 'schema.json'),
    JSON.stringify(schemaContent, null, 2)
);

const importCode = `// @ts-nocheck\nimport { factories } from '@strapi/strapi';\n\nexport default factories.createCore`;

fs.writeFileSync(
    path.join(apiDir, 'controllers', `${schemaName}.ts`),
    `${importCode}Controller('api::${schemaName}.${schemaName}');\n`
);

fs.writeFileSync(
    path.join(apiDir, 'routes', `${schemaName}.ts`),
    `${importCode}Router('api::${schemaName}.${schemaName}');\n`
);

fs.writeFileSync(
    path.join(apiDir, 'services', `${schemaName}.ts`),
    `${importCode}Service('api::${schemaName}.${schemaName}');\n`
);

console.log('Manual generado exitosamente!');
