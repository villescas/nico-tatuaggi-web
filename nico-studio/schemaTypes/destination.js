export default {
    name: 'destination',
    title: 'Próximos Destinos',
    type: 'document',
    fields: [
        {
            name: 'showOnWeb',
            title: 'Mostrar en la página web',
            type: 'boolean',
            initialValue: true,
            description: 'Apagá este botón si querés ocultar este destino temporalmente.'
        },
        {
            name: 'city',
            title: 'Ciudad (Ej: Buenos Aires)',
            type: 'string',
        },
        {
            name: 'country',
            title: 'País (Ej: Argentina)',
            type: 'string',
        },
        {
            name: 'startDate',
            title: 'Fecha de Inicio',
            type: 'date',
            options: {
                dateFormat: 'DD-MM-YYYY',
                calendarTodayLabel: 'Hoy'
            }
        },
        {
            name: 'endDate',
            title: 'Fecha de Fin',
            type: 'date',
            options: {
                dateFormat: 'DD-MM-YYYY',
                calendarTodayLabel: 'Hoy'
            }
        },
        {
            name: 'studioName',
            title: 'Nombre del Estudio (Opcional)',
            type: 'string',
            description: 'Nombre del estudio donde estarás tatuando.'
        },
        {
            name: 'studioLink',
            title: 'Link del Estudio (Instagram o Web)',
            type: 'url',
            description: 'Opcional. URL al perfil de Instagram o sitio web del estudio.'
        }
    ]
}