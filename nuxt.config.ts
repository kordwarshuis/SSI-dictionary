// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Include Bootstrap CSS globally
  css: ['bootstrap/dist/css/bootstrap.min.css'],

  // Static site generation for GitHub Pages
  ssr: true,

  app: {
    // Set the base URL for GitHub Pages deployment
    // Change this to match your GitHub Pages URL if needed
    // e.g. baseURL: '/SSI-dictionary/'
    baseURL: '/',
    head: {
      title: 'SSI Dictionary',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'A searchable dictionary of Self-Sovereign Identity (SSI) terms from multiple authoritative sources.'
        }
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    }
  },

  // Auto-import components
  components: true,

  // Nitro config for static generation
  nitro: {
    prerender: {
      routes: ['/']
    }
  },

  compatibilityDate: '2024-11-01'
})
