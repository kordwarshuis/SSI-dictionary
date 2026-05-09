import type { RouterOptions } from 'vue-router'

// Disable Vue Router's built-in hash-scroll behaviour.
// The DictionaryView component handles hash navigation itself via
// DynamicScroller.scrollToItem(), because the target element is only
// rendered on-demand by the virtual scroller (not always present in the DOM).
export default {
  scrollBehavior: () => false
} satisfies RouterOptions
