# SSI Dictionary

A **Nuxt 3 / Vue.js** static site that displays a searchable, filterable dictionary of Self-Sovereign Identity (SSI) terms aggregated from multiple authoritative sources.

Replaces the Docusaurus-embedded React component that previously lived in the WOT-terms repository.

---

## Architecture

| Layer | Technology |
|---|---|
| Framework | [Nuxt 3](https://nuxt.com) (SSG mode) |
| UI | Vue 3 `<script setup>` |
| Styles | [Bootstrap 5](https://getbootstrap.com) |
| Data | `public/data/dictionary.json` (generated, committed by CI) |
| Hosting | GitHub Pages |

### Data pipeline

```
External glossary websites
        │
        ▼
fetchExternalContent/fetchExternalGlossaries/
  ├── fetchDigitalGovtNzContent.mjs
  ├── fetchEssifLabContent.mjs
  ├── fetchNistContent.mjs          (downloads ZIP)
  ├── fetchToIPContent.mjs
  ├── fetchToipDidWebs.mjs
  ├── fetchTswgAcdc.mjs
  ├── fetchTswgCesr.mjs
  ├── fetchTswgKeri.mjs
  ├── fetchW3cDid.mjs
  └── fetchWotTermsContent.mjs      (reads WOT-terms Markdown)
        │
        ▼ individual JSON files in public/data/glossaries/
        │
createDictionary.mjs
        │
        ▼
public/data/dictionary.json         ← committed by GitHub Action
        │
        ▼
Nuxt SSG (nuxt generate)
        │
        ▼
GitHub Pages
```

The pipeline runs automatically every day at 02:00 UTC via `.github/workflows/fetch-glossaries.yml` and can also be triggered manually from the **Actions** tab on GitHub.

---

## Getting started

### Prerequisites

- Node.js ≥ 20

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/SSI-dictionary.git
cd SSI-dictionary
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env if you need non-default output paths
```

### 3. Fetch glossary data locally

```bash
npm run fetch-glossaries
# or run individual steps:
node fetchExternalContent/fetchExternalGlossaries/fetchEssifLabContent/fetchEssifLabContent.mjs
# ...
node fetchExternalContent/fetchExternalGlossaries/createDictionary.mjs
```

This writes individual JSON files to `public/data/glossaries/` and combines them into `public/data/dictionary.json`.

### 4. Start the development server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Build for production (static)

```bash
npm run generate
# Output: .output/public/
```

---

## Single URLs list (formerly Google Sheets)

The file `data/single-urls.csv` is a CSV with the URLs that were previously stored in a Google Sheet. Columns:

| Column | Description |
|---|---|
| `url` | Full URL to the page |
| `label` | Short human-readable label |
| `description` | Optional description |

Edit this file directly in the repository instead of updating the Google Sheet.

---

## GitHub Actions

| Workflow | Trigger | Purpose |
|---|---|---|
| `fetch-glossaries.yml` | Daily 02:00 UTC + manual | Fetches all external glossaries and commits updated `dictionary.json` |
| `deploy.yml` | Push to `main` + after fetch workflow | Builds the static site with `nuxt generate` and deploys to GitHub Pages |

To trigger the fetch manually: **Actions → Fetch External Glossaries → Run workflow**.

---

## Project structure

```
SSI-dictionary/
├── .env.example                    # Environment variable template
├── .github/
│   └── workflows/
│       ├── fetch-glossaries.yml    # Daily scraping job
│       └── deploy.yml              # GitHub Pages deployment
├── app.vue                         # Nuxt entry point
├── components/
│   └── DictionaryView.vue          # Main dictionary UI component
├── data/
│   └── single-urls.csv             # URLs formerly in Google Sheets
├── fetchExternalContent/
│   └── fetchExternalGlossaries/
│       ├── fetch*.mjs              # Individual glossary scrapers
│       ├── createDictionary.mjs    # Combines individual JSONs
│       └── main.sh                 # Runs all scrapers sequentially
├── modules-js-node/                # Node-only utilities (cleanJson, etc.)
├── modules-js-universal/           # Universal utilities
├── nuxt.config.ts
├── package.json
├── pages/
│   └── index.vue                   # Dictionary page
└── public/
    └── data/
        ├── glossaries/             # Per-source JSON files (generated)
        └── dictionary.json         # Combined dictionary (generated)
```

---

## Adding a new glossary source

1. Create `fetchExternalContent/fetchExternalGlossaries/fetchMySource/fetchMySource.mjs`  
   — follow the pattern of any existing fetcher; write output to  
   `path.join(process.env.GENERATED_JSON_GLOSSARIES_DIR, 'terms-definitions-mysource.json')`

2. Add a step to `.github/workflows/fetch-glossaries.yml` (copy an existing step, adjust the script path).

3. Optionally add a line to `fetchExternalContent/fetchExternalGlossaries/main.sh` for local runs.

The `createDictionary.mjs` script automatically picks up every `.json` file in `GENERATED_JSON_GLOSSARIES_DIR`, so no further changes are needed.
