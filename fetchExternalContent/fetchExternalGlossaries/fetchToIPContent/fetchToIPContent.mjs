import axios from 'axios';
import cleanJsonFile from '../../../modules-js-node/cleanJson.mjs';
import dotenv from 'dotenv';
import { ensureDirectoryExists } from '../../../modules-js-node/ensureDir.mjs';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('ToIP: Fetching external content...');

// Config
const url = 'https://glossary.trustoverip.org/index.html';
const organisation = 'ToIP';
const jsonFileName = 'terms-definitions-toip.json';

axios.get(url)
    .then(response => {
        const html = response.data;
        const $ = load(html);
        const terms = [];

        // 1: Find #terminology section, then 2: the next sibling that is <dl>, then 3: each loop through <dt>
        // const termsList = $('#terms-and-definitions').next('dl');
        const termsList = $('#terms-and-definitions').nextAll('dl').first();
        termsList.find('dt').each((i, el) => {
            const term = $(el).text().trim();
            const anchor = term.replace(/[\s-]+/g, ''); // Remove spaces and dashes from 'term' to create 'anchor'
            const definition = $(el).next('dd').text().trim();
            terms.push({ organisation, url, term, definition, anchor });
        });

        const outputDirectory = process.env.GENERATED_JSON_GLOSSARIES_DIR || 'public/data/glossaries';
    ensureDirectoryExists(outputDirectory);
    const filePath = path.join(outputDirectory, jsonFileName);
        fs.writeFile(filePath, JSON.stringify(terms), err => {
            if (err) {
                console.error(err);
            } else {
                // Clean the JSON file, remove non-printable characters
                cleanJsonFile(filePath, filePath);

                console.log(`Terms saved to ${jsonFileName}`);
            }
        });
    })
    .catch(error => {
        console.error(error);
    });
