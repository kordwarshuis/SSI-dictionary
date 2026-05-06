/**
 * toLowerCaseAndRemoveSpecialChars.js
 * Normalises a string for fuzzy comparison: lower-case and strip
 * whitespace, hyphens, underscores and em-dashes.
 */

export function toLowerCaseAndRemoveSpecialChars(str) {
  return String(str).toLowerCase().replace(/[\s\-_—]/g, '')
}
