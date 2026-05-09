// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Include Bootstrap CSS globally, then our crypto theme on top
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '~/assets/css/provence-theme.css',
    'vue-virtual-scroller/dist/vue-virtual-scroller.css'
  ],

  build: {
    transpile: ['vue-virtual-scroller']
  },

  // Static site generation for GitHub Pages
  ssr: true,

  app: {
    // Sub-path used by GitHub Pages project sites:
    // https://kordwarshuis.github.io/SSI-dictionary/
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/SSI-dictionary/',
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
      // Disable the link crawler – it follows URLs found in dictionary data
      // and fails on external/missing paths, breaking the build.
      crawlLinks: false,
      // Prerender the API route so it is served as a static JSON file
      // on gh-pages (no server available there for client-side fetches).
      routes: ['/', '/api/dictionary.json']
    }
  },

  compatibilityDate: '2024-11-01'
})
