const fs = require('fs');
const path = require('path');

const baseApiDir = path.join(__dirname, 'src', 'api');

const schemas = [
    {
        name: 'tattoo',
        kind: 'collectionType',
        info: { singularName: 'tattoo', pluralName: 'tattoos', displayName: 'Tattoo', description: 'Portfolio tattoos' },
        attributes: {
            title: { type: 'string', required: true },
            style: { type: 'enumeration', enum: ['black_grey', 'color', 'cover_up'], required: true },
            showOnWeb: { type: 'boolean', default: true },
            videoUrl: { type: 'text' },
            media: { type: 'media', multiple: true, required: false, allowedTypes: ['images', 'files', 'videos', 'audios'] },
            beforeImage: { type: 'media', multiple: false, required: false, allowedTypes: ['images'] }
        }
    },
    {
        name: 'destination',
        kind: 'collectionType',
        info: { singularName: 'destination', pluralName: 'destinations', displayName: 'Destination', description: 'Upcoming travel locations' },
        attributes: {
            city: { type: 'string', required: true },
            country: { type: 'string', required: true },
            startDate: { type: 'date', required: true },
            endDate: { type: 'date', required: true },
            studioName: { type: 'string' },
            studioLink: { type: 'string' },
            showOnWeb: { type: 'boolean', default: true }
        }
    },
    {
        name: 'city-request',
        kind: 'collectionType',
        info: { singularName: 'city-request', pluralName: 'city-requests', displayName: 'City Request', description: 'Lead requests from users' },
        attributes: {
            name: { type: 'string', required: true },
            contact: { type: 'string', required: true },
            city: { type: 'string', required: true }
        }
    },
    {
        name: 'profile',
        kind: 'singleType',
        info: { singularName: 'profile', pluralName: 'profiles', displayName: 'Profile', description: 'Global contact info' },
        attributes: {
            name: { type: 'string', required: true },
            whatsapp: { type: 'string' },
            instagram: { type: 'string' },
            heroBanner: { type: 'media', multiple: false, required: true, allowedTypes: ['images', 'videos'] }
        }
    },
    {
        name: 'popup',
        kind: 'singleType',
        info: { singularName: 'popup', pluralName: 'popups', displayName: 'Popup', description: 'Interruptive popup' },
        attributes: {
            popupActive: { type: 'boolean', default: false },
            popupTitle: { type: 'string' },
            popupSubtitle: { type: 'string' },
            popupImage: { type: 'media', multiple: false, required: false, allowedTypes: ['images'] }
        }
    },
    {
        name: 'artist',
        kind: 'singleType',
        info: { singularName: 'artist', pluralName: 'artists', displayName: 'Artist', description: 'About Nico sections' },
        attributes: {
            name: { type: 'string', required: true },
            sections: {
                type: 'component',
                repeatable: true,
                component: 'layout.section'
            }
        }
    },
    {
        name: 'faq',
        kind: 'singleType',
        info: { singularName: 'faq', pluralName: 'faqs', displayName: 'FAQ' },
        attributes: {
            faqs: {
                type: 'component',
                repeatable: true,
                component: 'layout.faq-item'
            }
        }
    }
];

const components = {
    'layout.section': {
        collectionName: 'components_layout_sections',
        info: { displayName: 'Section', icon: 'layer' },
        attributes: {
            title: { type: 'string', required: true },
            text: { type: 'text' },
            imageLayout: { type: 'enumeration', enum: ['left', 'right', 'bottom'], default: 'right' },
            images: { type: 'media', multiple: true, required: false, allowedTypes: ['images'] }
        }
    },
    'layout.faq-item': {
        collectionName: 'components_layout_faq_items',
        info: { displayName: 'FAQ Item', icon: 'question' },
        attributes: {
            questionEs: { type: 'string', required: true },
            answerEs: { type: 'text', required: true }
        }
    }
};

// Create components
const compDir = path.join(__dirname, 'src', 'components', 'layout');
fs.mkdirSync(compDir, { recursive: true });

Object.entries(components).forEach(([key, schema]) => {
    const filename = key.split('.')[1] + '.json';
    fs.writeFileSync(path.join(compDir, filename), JSON.stringify(schema, null, 2));
});

// Create APIs
schemas.forEach(schema => {
    const apiDir = path.join(baseApiDir, schema.name);
    
    // Create folders
    ['content-types', 'controllers', 'routes', 'services'].forEach(folder => {
        if (folder === 'content-types') {
            fs.mkdirSync(path.join(apiDir, folder, schema.name), { recursive: true });
        } else {
            fs.mkdirSync(path.join(apiDir, folder), { recursive: true });
        }
    });

    // Write schema.json
    const schemaContent = {
        kind: schema.kind,
        collectionName: schema.info.pluralName,
        info: schema.info,
        options: { draftAndPublish: false },
        pluginOptions: {},
        attributes: schema.attributes
    };
    fs.writeFileSync(
        path.join(apiDir, 'content-types', schema.name, 'schema.json'),
        JSON.stringify(schemaContent, null, 2)
    );

    // Common TS for Strapi v5
    const importCode = `// @ts-nocheck\nimport { factories } from '@strapi/strapi';\n\nexport default factories.createCore`;

    // Write controller
    fs.writeFileSync(
        path.join(apiDir, 'controllers', `${schema.name}.ts`),
        `${importCode}Controller('api::${schema.name}.${schema.name}');\n`
    );

    // Write route
    fs.writeFileSync(
        path.join(apiDir, 'routes', `${schema.name}.ts`),
        `${importCode}Router('api::${schema.name}.${schema.name}');\n`
    );

    // Write service
    fs.writeFileSync(
        path.join(apiDir, 'services', `${schema.name}.ts`),
        `${importCode}Service('api::${schema.name}.${schema.name}');\n`
    );
});

console.log('Strapi Schemas & Controllers generated successfully!');
