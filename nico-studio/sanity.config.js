import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'nico-studio',

  projectId: 'ozqtzx80',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Contenido Principal')
          .items([
            // 1. Perfil y Contacto
            S.listItem()
              .title('Perfil y Contacto')
              .id('profile')
              .child(
                S.document()
                  .title('Perfil y Contacto')
                  .schemaType('profile')
                  .documentId('profile')
              ),
            // 2. El Artista
            S.listItem()
              .title('El Artista')
              .id('artist')
              .child(
                S.document()
                  .title('El Artista')
                  .schemaType('artist')
                  .documentId('artist')
              ),
            // 3. Preguntas Frecuentes (FAQ)
            S.listItem()
              .title('Preguntas Frecuentes')
              .id('faq')
              .child(
                S.document()
                  .title('Preguntas Frecuentes')
                  .schemaType('faq')
                  .documentId('faq')
              ),
            // 4. Pop-up Meme
            S.listItem()
              .title('Banner Emergente')
              .id('popup')
              .child(
                S.document()
                  .title('Banner Emergente')
                  .schemaType('popup')
                  .documentId('popup')
              ),
            S.divider(),
            // 4. Portfolio
            S.documentTypeListItem('portfolio').title('Portfolio de Tatuajes'),
            // 3. Destinos
            S.documentTypeListItem('destination').title('Próximos Destinos'),
            // 4. Pedidos de Ciudades
            S.documentTypeListItem('cityRequest').title('Ciudades Pedidas'),
          ]),
    }),
    visionTool()
  ],

  document: {
    actions: (prev, context) => {
      // Mostrar el botón de Borrar (prominente) para cityRequest y destination
      if (context.schemaType === 'cityRequest' || context.schemaType === 'destination') {
        const deleteAction = prev.find((act) => act.action === 'delete')

        // Retornamos un array donde el Delete es el primero (y por ende el más visible abajo a la derecha)
        if (deleteAction) {
          return [deleteAction]
        }
        return prev
      }
      return prev
    }
  },

  schema: {
    types: schemaTypes,
  },
})
