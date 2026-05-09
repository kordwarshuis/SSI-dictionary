<script setup>
/**
 * DictionaryView.vue
 *
 * Displays a searchable, filterable dictionary of SSI terms from multiple
 * authoritative sources. Ported from the original React component in WOT-terms.
 *
 * Props:
 *   termsData – Array of term objects produced by createDictionary.mjs
 *               Shape: [{ term, anchor, definitions: [{ organisation, definition, url, anchor }] }]
 */

const props = defineProps({
  termsData: {
    type: Array,
    required: true,
    default: () => []
  }
})

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Normalises a string for comparison: lower-case and strip whitespace /
 * hyphens / underscores / em-dashes so "self-sovereign identity" and
 * "SelfSovereignIdentity" both match "self sovereign".
 */
function normalise(str) {
  return String(str)
    .toLowerCase()
    .replaceAll(/[\s\-_—]/g, '')
}

// ── State ──────────────────────────────────────────────────────────────────

const searchTerm = ref('')

// Derived from props so it is available during SSR and on first render,
// eliminating the flash of "sources: 0 / all terms hidden" that occurred
// when these were initialised only inside onMounted.
const organisations = computed(() => {
  const seen = new Set()
  props.termsData.forEach((term) =>
    term.definitions.forEach((def) => seen.add(def.organisation))
  )
  return Array.from(seen).sort()
})

// Stores per-org overrides; entries default to true (visible).
const orgOverrides = ref({})

// Controls whether definitions are shown for all terms by default.
const showDefinitions = ref(true)

// Per-term overrides that differ from the global visibility mode.
const termOverrides = ref({})

// Controls visibility of back-to-top button
const showBackToTop = ref(false)

const checkedOrganisations = computed(() => {
  const result = {}
  organisations.value.forEach((org) => {
    result[org] = org in orgOverrides.value ? orgOverrides.value[org] : true
  })
  return result
})

const organisationLinks = computed(() => {
  const links = {}
  props.termsData.forEach((term) =>
    term.definitions.forEach((def) => {
      if (def.organisation && def.url && !links[def.organisation]) {
        links[def.organisation] = def.url
      }
    })
  )
  return links
})
const animateCards = ref(false)

// ── Checkbox helpers ───────────────────────────────────────────────────────

function triggerAnimation() {
  animateCards.value = true
  setTimeout(() => {
    animateCards.value = false
  }, 1000)
}

function handleCheckboxChange(org) {
  triggerAnimation()
  orgOverrides.value = {
    ...orgOverrides.value,
    [org]: !checkedOrganisations.value[org]
  }
}

function toggleAllCheckboxes() {
  const next = {}
  organisations.value.forEach((org) => {
    next[org] = !checkedOrganisations.value[org]
  })
  orgOverrides.value = next
}

function turnAllOn() {
  const next = {}
  organisations.value.forEach((org) => { next[org] = true })
  orgOverrides.value = next
}

function turnAllOff() {
  const next = {}
  organisations.value.forEach((org) => { next[org] = false })
  orgOverrides.value = next
}

function setAllTermsVisible(nextVisible) {
  showDefinitions.value = nextVisible
  termOverrides.value = {}
}

// ── Tokeniser ──────────────────────────────────────────────────────────────
// Splits a term name into discrete tokens on any separator character.
// "self-addressing identifier (SAID)" → ["self", "addressing", "identifier", "SAID"]
const TOKEN_SEP = /[\s\-_,()/]+/

function tokenise(str) {
  return String(str).split(TOKEN_SEP).filter(Boolean)
}

// ── Visibility filter ──────────────────────────────────────────────────────

function isTermVisible(term) {
  const raw = searchTerm.value.trim()

  // An empty search string matches every term
  if (!raw) {
    return term.definitions.some((def) => checkedOrganisations.value[def.organisation])
  }

  // Tokenise BOTH the query and the term name.
  // Every query token must match at least one term token (AND semantics).
  // An all-uppercase query token (≥2 chars) is an abbreviation → exact match;
  // otherwise prefix match ("key" matches "Key", "keyboard", …).
  const queryTokens = tokenise(raw)
  const termTokens = tokenise(term.term)

  const termMatches = queryTokens.every((qRaw) => {
    const qNorm = normalise(qRaw)
    const isAbbreviation = qRaw.length >= 2 && /^[A-Z0-9]+$/.test(qRaw)
    return termTokens.some((tRaw) => {
      const tNorm = normalise(tRaw)
      return isAbbreviation ? tNorm === qNorm : tNorm.startsWith(qNorm)
    })
  })

  if (!termMatches) return false
  return term.definitions.some((def) => checkedOrganisations.value[def.organisation])
}

function isDefinitionsVisible(term) {
  if (term.anchor in termOverrides.value) {
    return termOverrides.value[term.anchor]
  }
  return showDefinitions.value
}

function toggleTerm(term) {
  termOverrides.value = {
    ...termOverrides.value,
    [term.anchor]: !isDefinitionsVisible(term)
  }
}

// ── Term highlight ───────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function highlightTerm(termName) {
  const raw = searchTerm.value.trim()
  if (!raw) return escapeHtml(termName)

  // Build the same query-token list used in isTermVisible.
  const queryTokens = tokenise(raw).map((qRaw) => ({
    norm: normalise(qRaw),
    isAbbreviation: qRaw.length >= 2 && /^[A-Z0-9]+$/.test(qRaw)
  }))

  // Walk the term name token-by-token, preserving separators.
  const parts = termName.split(/([ \-_,()/]+)/)
  let result = ''
  for (const part of parts) {
    if (TOKEN_SEP.test(part)) {
      result += escapeHtml(part)
    } else {
      const normPart = normalise(part)
      const hit = queryTokens.some(({ norm, isAbbreviation }) =>
        isAbbreviation ? normPart === norm : normPart.startsWith(norm)
      )
      result += hit ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)
    }
  }
  return result
}

// ── HTML sanitisation ──────────────────────────────────────────────────────
// The definition HTML is produced by our own scraping pipeline (trusted source).
// We keep v-html but strip any <script> tags as a minimal safety measure.
// Also ensure external links open in a new tab with noopener noreferrer.
function safeHtml(html) {
  return String(html)
    .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replaceAll(/<a\b([^>]*?)>/gi, (match, attrs) => {
      if (/target\s*=\s*["']?_blank["']?/i.test(attrs)) {
        return `<a${attrs}>`
      }

      let newAttrs = attrs
      if (!/rel\s*=\s*['"]/i.test(newAttrs)) {
        newAttrs += ' rel="noopener noreferrer"'
      }
      if (!/target\s*=\s*['"]/i.test(newAttrs)) {
        newAttrs += ' target="_blank"'
      }
      return `<a${newAttrs}>`
    })
}
// ── Back to top button ─────────────────────────────────────────────────────

function handleScroll() {
  showBackToTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})</script>

<template>
  <div class="glossaries-combined">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10 col-xl-9 col-xxl-8 mx-auto">

        <!-- Search bar -->
        <div class="input-group mb-3">
          <span class="input-group-text" id="search-addon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search"
              viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
            </svg>
          </span>
          <input v-model="searchTerm" type="text" class="form-control" placeholder="grep terms…"
            aria-label="Search terms" aria-describedby="search-addon" />
          <button v-if="searchTerm" class="btn btn-outline-secondary clear-btn" type="button"
            aria-label="Clear search" @click="searchTerm = ''">&#x2715;</button>
        </div>

        <!-- Stats row -->
        <hr />

        <!-- Source visibility controls -->
        <div class="mb-3 d-flex gap-2 flex-wrap">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleAllCheckboxes">
            toggle sources
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="turnAllOn">
            all sources on
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="turnAllOff">
            all sources off
          </button>
        </div>

        <!-- Organisation checkboxes -->
        <div class="d-flex flex-wrap gap-2 mb-2">
          <div v-for="org in organisations" :key="org" class="form-check form-check-inline">
            <input :id="`checkbox-${org}`" class="form-check-input" type="checkbox" :checked="checkedOrganisations[org]"
              @change="handleCheckboxChange(org)" />
            <label class="form-check-label" :for="`checkbox-${org}`">
              <span>{{ org }}</span>
              <a v-if="organisationLinks[org]" :href="organisationLinks[org]" target="_blank" rel="noopener noreferrer"
                class="ms-1 text-decoration-none" title="Open source link">
                ↗
              </a>
            </label>
          </div>
        </div>

        <hr />

        <!-- Term visibility toggle -->
        <div class="mb-3 d-flex flex-wrap gap-2 align-items-center term-visibility-toggle">
          <button type="button" class="btn btn-sm ms-1" :class="showDefinitions ? 'btn-secondary' : 'btn-outline-secondary'"
            @click="setAllTermsVisible(true)">
            Terms and definitions visible
          </button>
          <button type="button" class="btn btn-sm" :class="!showDefinitions ? 'btn-secondary' : 'btn-outline-secondary'"
            @click="setAllTermsVisible(false)">
            Only terms visible
          </button>
        </div>

        <!-- Terms list -->
        <ul class="list-unstyled">
          <li v-for="term in termsData" :key="term.anchor"
            :class="['term-item', { 'd-none': !isTermVisible(term), 'mb-5': isDefinitionsVisible(term), 'mb-2 border border-secondary-subtle p-2 rounded term-collapsed': !isDefinitionsVisible(term) }]">
            <h2 :id="term.anchor" class="h4 term-heading">
              <span class="term-heading-row">
                <button type="button" class="term-toggle" @click="toggleTerm(term)">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-html="highlightTerm(term.term)"></span>
                </button>
                <a
                  :href="`#${term.anchor}`"
                  class="term-anchor-link"
                  title="Copy link to this term"
                  aria-label="Link to this term"
                  @click.stop
                >#</a>
              </span>
            </h2>

            <ul v-if="isDefinitionsVisible(term)" class="list-unstyled ms-2">
              <li v-for="(def, defIndex) in term.definitions" :key="defIndex"
                :class="{ 'd-none': !checkedOrganisations[def.organisation] }" class="mb-3">
                <div :class="['card', { 'animate-outline': animateCards }]">
                  <div class="card-header d-flex justify-content-end">
                    <span class="badge bg-secondary fs-6 fw-normal">
                      {{ def.organisation }}
                    </span>
                  </div>
                  <div class="card-body">
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div v-if="def.definition" class="card-text" v-html="safeHtml(def.definition)"></div>
                    <p v-else class="card-text definition-placeholder">
                      This is externally referenced and therefor not included here.
                    </p>
                  </div>
                  <div class="card-footer">
                    <a :href="def.url" target="_blank" rel="noopener noreferrer">
                      learn more
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </li>
        </ul>

      </div>
    </div>

    <!-- Back to top button -->
    <button v-if="showBackToTop" class="back-to-top-btn" @click="scrollToTop" aria-label="Back to top"
      title="Scroll back to top">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-arrow-up"
        viewBox="0 0 16 16" aria-hidden="true">
        <path fill-rule="evenodd"
          d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
mark {
  background-color: rgba(255, 223, 104, 0.72);
  color: #6a3f0f;
  padding: 0 2px;
  border-radius: 2px;
}
.clear-btn {
  border-left: 0;
  color: #6c757d;
  line-height: 1;
}
.clear-btn:hover {
  color: #000;
  background: transparent;
}

.term-visibility-toggle {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0.5rem 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.86));
  backdrop-filter: blur(6px);
}

.term-toggle {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  color: inherit;
  font: inherit;
}

.term-toggle:hover {
  text-decoration: underline;
}

.term-toggle:focus-visible {
  outline: 2px solid var(--bs-secondary);
  outline-offset: 4px;
}

.term-heading-row {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
}

.term-anchor-link {
  flex: 0 0 auto;
  font-size: 0.95rem;
  color: var(--bs-secondary);
  text-decoration: none;
  line-height: 1;
}

.term-anchor-link:hover,
.term-anchor-link:focus-visible {
  text-decoration: underline;
}

.term-collapsed {
  background-color: rgba(154, 159, 104, 0.12);
}

.back-to-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: var(--bs-secondary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.back-to-top-btn:hover {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.back-to-top-btn:active {
  transform: translateY(0);
}

.back-to-top-btn:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}
</style>
