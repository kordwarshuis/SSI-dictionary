/**
 * Strip HTML markup from a glossary term name.
 *
 * NIST wraps some labels in <em>, <strong>, <i>, <sub>, <sup>, and MathJax
 * spans. Those tags must not appear as literal text in search results.
 */

const HTML_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
}

const LATEX_SYMBOLS = {
  in: 'in',
  varepsilon: 'epsilon',
  epsilon: 'epsilon'
}

function decodeEntity(match, entity) {
  if (entity[0] === '#') {
    const code = entity[1] === 'x' || entity[1] === 'X'
      ? Number.parseInt(entity.slice(2), 16)
      : Number.parseInt(entity.slice(1), 10)
    if (!Number.isFinite(code)) return match
    try {
      return String.fromCodePoint(code)
    } catch {
      return match
    }
  }
  return HTML_ENTITIES[entity.toLowerCase()] ?? match
}

function stripTags(value) {
  return String(value).replace(/<\/?[a-zA-Z][^>]*>/g, '')
}

function decodeLatex(latex) {
  return String(latex)
    .replace(/\\([a-zA-Z]+)/g, (_, name) => LATEX_SYMBOLS[name] ?? name)
    .replace(/\\[()]/g, '')
    .trim()
}

export function stripHtmlFromTerm(value) {
  if (value == null) return ''

  return String(value)
    .replace(
      /<span[^>]*class=["'][^"']*math-tex[^"']*["'][^>]*>\s*\\\(([\s\S]*?)\\\)\s*<\/span>/gi,
      (_, latex) => decodeLatex(latex)
    )
    .replace(/<sub>([\s\S]*?)<\/sub>/gi, (_, inner) => `_${stripTags(inner)}`)
    .replace(/<sup>([\s\S]*?)<\/sup>/gi, (_, inner) => `^${stripTags(inner)}`)
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity)
    .replace(/[\u00A0\s]+/g, ' ')
    .trim()
}

export default stripHtmlFromTerm
