/**
 * Static hosts prerender one URL. On hydration Nuxt briefly replaces the
 * address with that path and drops ?q= until the page suspense resolves.
 * Capture the term first so a shared link still runs the search.
 */
export default defineNuxtPlugin({
  name: 'capture-search-query',
  enforce: 'pre',
  setup() {
    const term = new URLSearchParams(globalThis.location.search).get('q')?.trim() ?? ''
    return {
      provide: {
        initialSearchTerm: term
      }
    }
  }
})
