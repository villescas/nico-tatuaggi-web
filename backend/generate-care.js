const fs = require('fs');
const path = require('path');

const baseApiDir = path.join(__dirname, 'src', 'api');
const schemaName = 'care';
const componentName = 'layout.care-step';

// 1. Generate Component
const compDir = path.join(__dirname, 'src', 'components', 'layout');
fs.mkdirSync(compDir, { recursive: true });

const stepComponent = {
    collectionName: 'components_layout_care_steps',
    info: { displayName: 'Care Step', icon: 'heart' },
    attributes: {
        title: { type: 'string', required: true },
        icon: { type: 'enumeration', enum: ['wash', 'hydrate', 'avoid'], default: 'wash' },
        description: { type: 'text', required: true },
        image: { type: 'media', multiple: false, required: false, allowedTypes: ['images'] },
        alertText: { type: 'string' }
    }
};

fs.writeFileSync(path.join(compDir, 'care-step.json'), JSON.stringify(stepComponent, null, 2));

// 2. Generate API
const apiDir = path.join(baseApiDir, schemaName);

['content-types', 'controllers', 'routes', 'services'].forEach(folder => {
    if (folder === 'content-types') {
        fs.mkdirSync(path.join(apiDir, folder, schemaName), { recursive: true });
    } else {
        fs.mkdirSync(path.join(apiDir, folder), { recursive: true });
    }
});

const schemaContent = {
    kind: 'singleType',
    collectionName: 'cares',
    info: { singularName: 'care', pluralName: 'cares', displayName: 'Care Instructions', description: 'Tattoo aftercare guide' },
    options: { draftAndPublish: false },
    pluginOptions: {},
    attributes: {
        title: { type: 'string', default: 'Cuidados' },
        subtitle: { type: 'string', default: 'Guía para la curación perfecta de tu tatuaje' },
        steps: {
            type: 'component',
            repeatable: true,
            component: 'layout.care-step'
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

console.log('Care Instructions schema generated successfully!');
