import axios from 'axios';
import cleanJsonFile from '../../../modules-js-node/cleanJson.mjs';
import dotenv from 'dotenv';
import { ensureDirectoryExists } from '../../../modules-js-node/ensureDir.mjs';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
// Add or remove entries here to include more Spec-Up-T specifications.
// Each entry must have:
//   url          – full URL of the rendered Spec-Up-T HTML page
//   organisation – label shown in the dictionary UI
//   jsonFileName – output filename written to GENERATED_JSON_GLOSSARIES_DIR
const SPEC_UP_T_SOURCES = [
    {
        url: 'https://trustoverip.github.io/kswg-keri-specification/index.html',
        organisation: 'KERI',
        jsonFileName: 'terms-definitions-kswg-keri.json',
    },
    {
        url: 'https://trustoverip.github.io/kswg-acdc-specification/index.html',
        organisation: 'ACDC',
        jsonFileName: 'terms-definitions-kswg-acdc.json',
    },
    {
        url: 'https://trustoverip.github.io/kswg-cesr-specification/index.html',
        organisation: 'CESR',
        jsonFileName: 'terms-definitions-kswg-cesr.json',
    },
    {
        url: 'https://trustoverip.github.io/kerisuite-glossary/index.html',
        organisation: 'KERI Suite',
        jsonFileName: 'terms-definitions-kerisuite-glossary.json',
    },
    {
        url: 'https://glossary.trustoverip.org',
        organisation: 'ToIP',
        jsonFileName: 'terms-definitions-toip-glossary.json',
    },
    {
        url: 'https://trustoverip.github.io/kswg-did-method-webs-specification/index.html',
        organisation: 'ToIP (DID:Webs)',
        jsonFileName: 'terms-definitions-toipdidwebs.json',
    },
    {
        url: 'https://trustoverip.github.io/ctwg-general-glossary/index.html',
        organisation: 'ToIP General',
        jsonFileName: 'terms-definitions-general-glossary.json',
    },
    {
        url: 'https://henkvancann.github.io/vlei-glossary/index.html',
        organisation: 'vLEI',
        jsonFileName: 'terms-definitions-vlei-glossary.json',
    },
];
// ── End config ────────────────────────────────────────────────────────────────

const outputDirectory = process.env.GENERATED_JSON_GLOSSARIES_DIR || 'public/data/glossaries';
ensureDirectoryExists(outputDirectory);

async function fetchSource({ url, organisation, jsonFileName }) {
    console.log(`${organisation}: Fetching external content...`);

    const response = await axios.get(url);
    const $ = load(response.data);
    const terms = [];

    // Spec-Up-T renders terms inside a <dl class="terms-and-definitions-list">
    // that immediately follows the #terms-and-definitions heading.
    const termsList = $('#terms-and-definitions').nextAll('dl').first();
    termsList.find('dt').each((i, el) => {
        const term = $(el).text().trim();
        const anchor = term.replace(/[\s-]+/g, '');
        const definition = $(el).next('dd').text().trim();
        terms.push({ organisation, url, term, definition, anchor });
    });

    const filePath = path.join(outputDirectory, jsonFileName);
    fs.writeFileSync(filePath, JSON.stringify(terms));
    await cleanJsonFile(filePath, filePath);
    console.log(`${organisation}: ${terms.length} terms saved to ${jsonFileName}`);
}

// Run all sources sequentially so log output stays readable
for (const source of SPEC_UP_T_SOURCES) {
    try {
        await fetchSource(source);
    } catch (err) {
        console.error(`${source.organisation}: Failed – ${err.message}`);
    }
}
