export default {
    name: 'profile',
    title: 'Perfil y Contacto',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Nombre del Estudio / Perfil',
            type: 'string',
            initialValue: 'Nico Tatuaggi'
        },
        {
            name: 'heroBanner',
            title: 'Banner / Video Principal (Hero)',
            type: 'file',
            options: {
                accept: 'image/*,video/mp4'
            },
            description: 'Sube un video corto (.mp4) o una imagen de alta calidad para el fondo. Se recomiendan dimensiones de 1080x1920 (Vertical) para celulares o 1920x1080 (Horizontal) para PC.'
        },
        {
            name: 'whatsapp',
            title: 'Número de WhatsApp',
            type: 'string',
            description: 'Ejemplo: +5491123456789 (Sin espacios ni guiones, solo números y el +)'
        },
        {
            name: 'instagram',
            title: 'Link de Instagram',
            type: 'url',
            description: 'Ejemplo: https://instagram.com/nicotatuaggi'
        }
    ],
    preview: {
        select: {
            title: 'name'
        },
        prepare(selection) {
            return {
                title: selection.title || 'Perfil y Contacto',
                subtitle: 'Información general de la web'
            }
        }
    }
}