export default {
    name: 'faq',
    title: 'Preguntas Frecuentes',
    type: 'document',
    fields: [
        {
            name: 'faqs',
            title: 'Lista de Preguntas',
            description: 'Agrega y visualiza las preguntas frecuentes que aparecerán en la web.',
            type: 'array',
            of: [
                {
                    type: 'object',
                    title: 'Pregunta Frecuente',
                    fields: [
                        {
                            name: 'questionEs',
                            title: 'Pregunta (ES)',
                            type: 'string',
                            validation: Rule => Rule.required()
                        },
                        {
                            name: 'answerEs',
                            title: 'Respuesta (ES)',
                            type: 'text',
                            description: 'Puede contener varias líneas.',
                            validation: Rule => Rule.required()
                        },
                        {
                            name: 'questionEn',
                            title: 'Pregunta (EN)',
                            type: 'string',
                            validation: Rule => Rule.required()
                        },
                        {
                            name: 'answerEn',
                            title: 'Respuesta (EN)',
                            type: 'text',
                            description: 'Traducción de la respuesta al inglés.',
                            validation: Rule => Rule.required()
                        }
                    ],
                    preview: {
                        select: {
                            title: 'questionEs',
                        }
                    }
                }
            ]
        }
    ],
    preview: {
        prepare() {
            return {
                title: 'Preguntas Frecuentes (FAQ)'
            }
        }
    }
}
