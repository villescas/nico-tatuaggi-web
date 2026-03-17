export default {
    name: 'cityRequest',
    title: 'Ciudades Pedidas',
    type: 'document',
    // Permite eliminar y archivar, pero quita el botón de crear a mano
    __experimental_actions: ['update', 'delete', 'publish'],
    fields: [
        {
            name: 'name',
            title: 'Nombre del Cliente',
            type: 'string',
        },
        {
            name: 'contact',
            title: 'Instagram o Email',
            type: 'string',
        },
        {
            name: 'city',
            title: 'Ciudad Solicitada',
            type: 'string',
        }
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: '_createdAt',
            city: 'city'
        },
        prepare({ title, subtitle, city }) {
            const date = subtitle ? new Date(subtitle).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Fecha desconocida';

            return {
                title: `${title} (${city})`,
                subtitle: `Solicitado el: ${date}`
            }
        }
    }
}