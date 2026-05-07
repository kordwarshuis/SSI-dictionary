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
    .replace(/[\s\-_—]/g, '')
}

// ── State ──────────────────────────────────────────────────────────────────

const searchTerm = ref('')
const organisations = ref([])
const checkedOrganisations = ref({});
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

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
  const seen = new Set()
  props.termsData.forEach((term) =>
    term.definitions.forEach((def) => seen.add(def.organisation))
  )

  const orgArray = Array.from(seen).sort()
  organisations.value = orgArray

  const initial = {}
  orgArray.forEach((org) => {
    initial[org] = true
  })
  checkedOrganisations.value = initial
})

// ── Checkbox helpers ───────────────────────────────────────────────────────

function triggerAnimation() {
  animateCards.value = true
  setTimeout(() => {
    animateCards.value = false
  }, 1000)
}

function handleCheckboxChange(org) {
  triggerAnimation()
  checkedOrganisations.value = {
    ...checkedOrganisations.value,
    [org]: !checkedOrganisations.value[org]
  }
}

function toggleAllCheckboxes() {
  const next = {}
  organisations.value.forEach((org) => {
    next[org] = !checkedOrganisations.value[org]
  })
  checkedOrganisations.value = next
}

function turnAllOn() {
  const next = {}
  organisations.value.forEach((org) => {
    next[org] = true
  })
  checkedOrganisations.value = next
}

function turnAllOff() {
  const next = {}
  organisations.value.forEach((org) => {
    next[org] = false
  })
  checkedOrganisations.value = next
}

// ── Visibility filter ──────────────────────────────────────────────────────

function isTermVisible(term) {
  const normalisedTerm = normalise(term.term)
  const normalisedSearch = normalise(searchTerm.value)

  // An empty search string matches every term
  if (!normalisedSearch) {
    return term.definitions.some((def) => checkedOrganisations.value[def.organisation])
  }

  const regex = new RegExp(normalisedSearch, 'i')
  return term.definitions.some(
    (def) => checkedOrganisations.value[def.organisation] && regex.test(normalisedTerm)
  )
}

// ── HTML sanitisation ──────────────────────────────────────────────────────
// The definition HTML is produced by our own scraping pipeline (trusted source).
// We keep v-html but strip any <script> tags as a minimal safety measure.
// Also ensure external links open in a new tab with noopener noreferrer.
function safeHtml(html) {
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<a\b([^>]*?)>/gi, (match, attrs) => {
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
</script>

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
        </div>

        <!-- Stats row -->
        <div class="d-flex gap-3 mb-3 flex-wrap align-items-center">
          <span class="stat-pill">
            nodes&nbsp;<span>{{ termsData.length }}</span>
          </span>
          <span class="stat-pill">
            sources&nbsp;<span>{{ organisations.length }}</span>
          </span>
        </div>

        <!-- Glossary source links -->
        <!-- <div class="mb-3 source-links small">
          <strong>// sources:</strong>
          <span v-for="(url, org) in organisationLinks" :key="org" class="me-3">
            <a v-if="organisations.includes(org)" :href="url" target="_blank" rel="noopener noreferrer"
              class="text-decoration-none">
              {{ org }} ↗
            </a>
          </span>
        </div> -->

        <!-- Glossary toggle buttons -->
        <div class="mt-3 mb-0 d-flex gap-2 flex-wrap">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="toggleAllCheckboxes">
            toggle
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="turnAllOn">
            all on
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="turnAllOff">
            all off
          </button>
        </div>

        <hr />

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

        <!-- Terms list -->
        <ul class="list-unstyled">
          <li v-for="term in termsData" :key="term.anchor" :class="{ 'd-none': !isTermVisible(term) }" class="mb-5">
            <h2 :id="term.anchor" class="h4 term-heading">
              <a :href="`#${encodeURIComponent(term.anchor)}`">
                {{ term.term }}
              </a>
            </h2>

            <ul class="list-unstyled ms-2">
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
                    <div v-if="def.definition" class="card-text" v-html="safeHtml(def.definition)" />
                    <p v-else class="card-text text-muted fst-italic">
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
  </div>
</template>
