export default {
    name: 'popup',
    title: 'Banner Emergente (Pop-up)',
    type: 'document',
    fields: [
        {
            name: 'popupActive',
            title: 'Activar Banner Emergente (Meme)',
            type: 'boolean',
            initialValue: false,
            description: 'Enciende o apaga el cartel de Último Momento al entrar a la web.'
        },
        {
            name: 'popupImage',
            title: 'Imagen del Banner Emergente',
            type: 'image',
            options: { hotspot: true }
        },
        {
            name: 'popupTitle',
            title: 'Título del Banner (Ej: Tatuadores buscan salida a la crisis)',
            type: 'string',
        },
        {
            name: 'popupSubtitle',
            title: 'Subtítulo del Banner (Ej: Crece el trabajo sexual masculino)',
            type: 'string',
        }
    ],
    preview: {
        prepare() {
            return {
                title: 'Configuración del Banner',
                subtitle: 'Pop-up de Último Momento'
            }
        }
    }
}
