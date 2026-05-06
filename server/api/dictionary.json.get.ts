import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(() => {
  const filePath = join(process.cwd(), 'public', 'data', 'dictionary.json')
  if (!existsSync(filePath)) {
    return []
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
})
