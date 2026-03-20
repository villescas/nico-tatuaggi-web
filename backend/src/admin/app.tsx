import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: ['es'],
    translations: {
      es: {
        "app.components.LeftMenu.navbrand.title": "Nico Tatuaggi",
        "app.components.LeftMenu.navbrand.workplace": "Terminal",
        "Auth.form.welcome.title": "Administración",
        "Auth.form.welcome.subtitle": "Inicia sesión para gestionar tu portfolio",
      },
    },
    theme: {
      light: {
        colors: {
          primary100: '#f6ecce',
          primary200: '#e5c977',
          primary500: '#d4af37',
          buttonPrimary500: '#d4af37',
        }
      },
      dark: {
        colors: {
          primary100: '#f6ecce',
          primary200: '#e5c977',
          primary500: '#d4af37',
          buttonPrimary500: '#d4af37',
        }
      }
    }
  },
  bootstrap(app: StrapiApp) {
  },
};
