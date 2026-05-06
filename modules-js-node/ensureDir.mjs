import fs from 'fs';

export function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`Created missing directory: ${directoryPath}`);
  }
}
