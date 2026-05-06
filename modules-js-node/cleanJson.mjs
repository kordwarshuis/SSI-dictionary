/**
 * cleanJson.mjs
 * Removes non-printable characters from all string values in a JSON file.
 */

import fs from 'fs/promises'

function cleanStrings(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/[^\x20-\x7E]/g, '')
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      cleanStrings(obj[key])
    }
  }
}

async function cleanJsonFile(inputFilePath, outputFilePath) {
  const raw = await fs.readFile(inputFilePath, 'utf8')
  const data = JSON.parse(raw)
  cleanStrings(data)
  await fs.writeFile(outputFilePath, JSON.stringify(data, null, 2), 'utf8')
  console.log(`Cleaned JSON written to ${outputFilePath}`)
}

export default cleanJsonFile
