export default {
    name: 'artist',
    title: 'El Artista',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Nombre del Artista',
            type: 'string',
            initialValue: 'Nico Tatuaggi'
        },
        {
            name: 'sections',
            title: 'Secciones de la Historia',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'title',
                            title: 'Título de la Sección',
                            type: 'string',
                            description: 'Ejemplo: "Orígenes", "El Estilo", "Viajes".'
                        },
                        {
                            name: 'text',
                            title: 'Texto de la Sección',
                            type: 'text'
                        },
                        {
                            name: 'images',
                            title: 'Imágenes',
                            type: 'array',
                            of: [{ type: 'image', options: { hotspot: true } }],
                            description: 'Si subes más de una foto, aparecerán flechas para pasarlas.'
                        },
                        {
                            name: 'imageLayout',
                            title: 'En Computadoras: ¿Dónde va la imagen?',
                            type: 'string',
                            options: {
                                list: [
                                    { title: 'Imagen a la Izquierda, Texto a la Derecha', value: 'left' },
                                    { title: 'Texto a la Izquierda, Imagen a la Derecha', value: 'right' },
                                    { title: 'Texto Arriba, Imagen Abajo', value: 'bottom' }
                                ],
                                layout: 'radio'
                            },
                            initialValue: 'right',
                            description: 'En celulares, la imagen siempre aparecerá arriba del texto.'
                        }
                    ],
                    preview: {
                        select: {
                            title: 'title',
                            media: 'images.0'
                        }
                    }
                }
            ],
            description: 'Agrega, quita o reordena las secciones que cuentan tu historia.'
        }
    ],
    preview: {
        select: {
            title: 'name'
        },
        prepare(selection) {
            return {
                title: selection.title || 'El Artista',
                subtitle: 'Historia y Estilo (Secciones Dinámicas)'
            }
        }
    }
}
