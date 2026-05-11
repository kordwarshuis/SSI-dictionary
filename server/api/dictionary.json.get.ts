import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(() => {
  const filePath = join(process.cwd(), 'public', 'data', 'dictionary.json')
  if (!existsSync(filePath)) {
    return []
  }

  const termsData = JSON.parse(readFileSync(filePath, 'utf-8'))
  const { mtime } = statSync(filePath)

  return {
    termsData,
    lastBuiltAt: mtime.toISOString()
  }
})
