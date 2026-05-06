/**
 * unzipFile.mjs
 * Extracts a ZIP archive to a destination directory.
 */

import AdmZip from 'adm-zip'

function unzipFile(zipFilePath, extractToDir) {
  const zip = new AdmZip(zipFilePath)
  zip.extractAllTo(extractToDir, /* overwrite */ true)
  console.log(`Extraction complete. Files extracted to ${extractToDir}`)
}

export default unzipFile
