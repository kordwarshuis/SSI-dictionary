/**
 * downloadFile.mjs
 * Downloads a file from a URL and saves it to the local filesystem.
 */

import axios from 'axios'
import fs from 'fs'

async function downloadFile(downloadUrl, fullPath) {
  const response = await axios({
    method: 'GET',
    url: downloadUrl,
    responseType: 'stream'
  })

  const writer = fs.createWriteStream(fullPath)
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

export default downloadFile
