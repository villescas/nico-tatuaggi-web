export default {
    name: 'portfolio',
    title: 'Portfolio de Tatuajes',
    type: 'document',
    fields: [
        {
            name: 'showOnWeb',
            title: 'Mostrar en la página web',
            type: 'boolean',
            initialValue: false, // Por defecto vienen apagadas desde Instagram
            description: 'Prendé este botón para que la foto sea pública.'
        },
        {
            name: 'title',
            title: 'Descripción breve',
            type: 'string',
        },
        {
            name: 'media',
            title: 'Contenido Multimedia (Fotos y Videos)',
            type: 'array',
            of: [
                { type: 'image', options: { hotspot: true } },
                { type: 'file', options: { accept: 'video/mp4' } }
            ],
            description: 'Sube las fotos o videos del tatuaje. Puedes reordenarlas arrastrándolas. El primer elemento será la portada.',
            validation: Rule => Rule.required().min(1)
        },
        {
            name: 'beforeImage',
            title: 'Foto del Antes (Solo para Cover-Ups)',
            type: 'image',
            options: { hotspot: true },
            description: 'Dejar vacío si no es un Cover-Up. Al hacer click en la foto del portfolio, alternará entre el Antes y el Después.'
        },
        {
            name: 'style',
            title: 'Estilo',
            type: 'string',
            options: {
                list: [
                    { title: 'Blanco y Negro (B&G)', value: 'black_grey' },
                    { title: 'Color', value: 'color' },
                    { title: 'Cover Up', value: 'cover_up' }
                ],
                layout: 'radio'
            }
        }
    ],
    preview: {
        select: {
            title: 'title',
            media: 'media.0'
        }
    }
}