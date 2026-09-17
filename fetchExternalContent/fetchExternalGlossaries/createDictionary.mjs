import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ensureDirectoryExists } from '../../modules-js-node/ensureDir.mjs';
import { stripHtmlFromTerm } from '../../modules-js-universal/stripHtmlFromTerm.mjs';

dotenv.config();

const directoryPathInput = process.env.GENERATED_JSON_GLOSSARIES_DIR || './public/data/glossaries';
const directoryPathOutput = process.env.GENERATED_JSON_DICTIONARY_DIR || './public/data';
const outputFilename = 'dictionary.json';

let termsMap = {};

if (!fs.existsSync(directoryPathInput)) {
    console.warn(`Input directory does not exist: ${directoryPathInput}. Creating it.`);
    fs.mkdirSync(directoryPathInput, { recursive: true });
}

if (!fs.existsSync(directoryPathOutput)) {
    fs.mkdirSync(directoryPathOutput, { recursive: true });
}

fs.readdir(directoryPathInput, (err, files) => {
    if (err) {
        console.error('Error reading directory', err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const filePath = path.join(directoryPathInput, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            let jsonData = JSON.parse(fileContent);

            if (!Array.isArray(jsonData)) {
                console.error(`File ${file} does not contain a top-level array. Skipping.`);
                return;
            }

            jsonData.forEach(entry => {
                const term = stripHtmlFromTerm(entry.term);
                // Skip the entry if the 'term' is an empty string
                if (!term) {
                    return;
                }

                const anchor = stripHtmlFromTerm(entry.anchor || term).replace(/[\s-]+/g, '');

                if (!termsMap[term]) {
                    termsMap[term] = {
                        term,
                        anchor,
                        definitions: []
                    };
                }
                termsMap[term].definitions.push({
                    organisation: entry.organisation,
                    definition: entry.definition,
                    url: entry.url,
                    anchor
                });
            });

        }
    });

    const finalArray = Object.values(termsMap);

    // Sort the finalArray alphabetically based on 'term'
    finalArray.sort((a, b) => {
        if (a.term < b.term) {
            return -1;
        }
        if (a.term > b.term) {
            return 1;
        }
        return 0;
    });

    if (!fs.existsSync(directoryPathOutput)) {
        fs.mkdirSync(directoryPathOutput, { recursive: true });
    }

    fs.writeFileSync(path.join(directoryPathOutput, outputFilename), JSON.stringify(finalArray, null, 2));
    console.log(`Dictionary file created at ${path.join(directoryPathOutput, outputFilename)}`);
});

export { };
