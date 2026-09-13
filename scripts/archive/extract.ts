/**
 * Ekstrakcja geometryczna arkuszy Leon do formatu posredniego.
 * Uruchomienie: node scripts/archive/extract.ts
 * Wymaga: pdftotext, pdfinfo (poppler). Bez nich skrypt zglasza brak i konczy sie bledem.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface ManifestSheet {
  sheet: string
  grade: number
  year: number
  season: string
  label: string
  expectedQuestions: number
  fileHint: string
  duplicateOf?: string
}

interface RawQuestion {
  number: number
  page: number
  rawText: string
  options: string[]
  confidence: 'high' | 'medium' | 'low'
  graphic: boolean
}

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..')
const ARCHIVE_DIR = join(ROOT, 'konkursy_z_poprzednich_lat')
const OUT_DIR = join(HERE, 'out')

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normName(s: string): string {
  return stripDiacritics(s.normalize('NFC'))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function romanToInt(token: string): number | null {
  const map: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 }
  return map[token] ?? null
}

function mangle(s: string): string {
  return stripDiacritics(s.normalize('NFC')).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function detectGradeYearSeason(file: string): { grade: number; year: number; season: string } | null {
  const n = ` ${normName(file)} `
  const gradeMatch = n.match(/klasa\s*([ivx\d]+)/)
  let grade = 0
  if (gradeMatch) {
    const token = gradeMatch[1]
    if (/^\d+$/.test(token)) grade = Number(token)
    else grade = romanToInt(token) ?? 0
  }
  const yearMatch = n.match(/(19|20)\d{2}/)
  const year = yearMatch ? Number(yearMatch[0]) : 0
  const season = n.includes('wiosna') ? 'wiosna' : n.includes('jesien') ? 'jesien' : ''
  if (!grade || !year || !season) return null
  return { grade, year, season }
}

const GRAPHIC_HINTS = [
  'zegar',
  'rysunku',
  'rysunek',
  'schematu',
  'schemat',
  'domina',
  'domino',
  'narysowan',
  'podanego ponizej',
  'podanej ponizej',
  'ktory zegar',
  'figura na',
]

function splitOptions(block: string): string[] {
  const byLetters = block.split(/(?=[ABCD][).:]\s)/g).map((s) => s.trim()).filter(Boolean)
  if (byLetters.length >= 3) return byLetters.slice(0, 4)
  const lines = block.split('\n').map((s) => s.trim()).filter(Boolean)
  if (lines.length >= 4) {
    const tail = lines.slice(-4)
    if (tail.every((l) => l.length < 60)) return tail
  }
  const cols = block.split(/\s{3,}|\t/g).map((s) => s.trim()).filter(Boolean)
  if (cols.length >= 4) return cols.slice(-4)
  return []
}

function segmentQuestions(layoutText: string): RawQuestion[] {
  const out: RawQuestion[] = []
  const parts = layoutText.split(/(?=^\s*\d{1,2}\s*[.)])/m).map((s) => s.trim()).filter(Boolean)
  for (const part of parts) {
    const m = part.match(/^(\d{1,2})\s*[.)]\s*([\s\S]*)$/)
    if (!m) continue
    const number = Number(m[1])
    if (number < 1 || number > 40) continue
    const body = m[2].trim()
    if (body.length < 3) continue
    const options = splitOptions(body)
    const low = stripDiacritics(body.toLowerCase())
    const graphic = GRAPHIC_HINTS.some((h) => low.includes(stripDiacritics(h))) || (body.length < 40 && /wskaz|zaznacz/i.test(body))
    const confidence = options.length >= 3 && body.length > 30 ? 'high' : options.length > 0 ? 'medium' : 'low'
    out.push({ number, page: 0, rawText: body.slice(0, 2000), options: options.slice(0, 4), confidence, graphic })
  }
  return out.sort((a, b) => a.number - b.number)
}

function main(): void {
  const manifest = JSON.parse(readFileSync(join(HERE, 'manifest.json'), 'utf8')) as {
    sheets: ManifestSheet[]
  }
  if (!existsSync(ARCHIVE_DIR)) {
    console.error(`Brak katalogu ${ARCHIVE_DIR}`)
    process.exit(1)
  }
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' })
  } catch {
    console.error('Brak narzedzia pdftotext (poppler). Zainstaluj poppler i sprobuj ponownie.')
    process.exit(1)
  }
  const files = readdirSync(ARCHIVE_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'))
  const indexed = files.map((file) => ({ file, meta: detectGradeYearSeason(file) }))
  mkdirSync(OUT_DIR, { recursive: true })

  let missing = 0
  let totalDetected = 0
  let totalExpected = 0
  const exceptions: { sheet: string; reason: string; detail: string }[] = []
  for (const sheet of manifest.sheets) {
    totalExpected += sheet.expectedQuestions
    const seasonNorm = stripDiacritics(sheet.season.toLowerCase())
    const candidates = indexed.filter(
      (e) =>
        e.meta &&
        e.meta.grade === sheet.grade &&
        e.meta.year === sheet.year &&
        stripDiacritics(e.meta.season) === seasonNorm,
    )
    if (candidates.length === 0) {
      console.error(`MANIFEST: brak pliku dla ${sheet.sheet} (${sheet.label})`)
      exceptions.push({ sheet: sheet.sheet, reason: 'missing-file', detail: sheet.fileHint })
      missing += 1
      continue
    }
    const want = mangle(sheet.fileHint)
    const pick =
      candidates.find((c) => mangle(c.file.replace(/\.pdf$/i, '')) === want) ??
      candidates.find((c) => mangle(c.file).includes(want)) ??
      candidates[0]
    const pdfPath = join(ARCHIVE_DIR, pick.file)
    let pages = 0
    try {
      const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' })
      pages = Number(info.match(/Pages:\s*(\d+)/)?.[1] ?? 0)
    } catch {
      pages = 0
    }
    let layout = ''
    try {
      layout = execFileSync('pdftotext', ['-layout', pdfPath, '-'], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      })
    } catch {
      layout = ''
    }
    const questions = segmentQuestions(layout)
    totalDetected += questions.length
    const diff = questions.length - sheet.expectedQuestions
    writeFileSync(
      join(OUT_DIR, `${sheet.sheet}.json`),
      JSON.stringify(
        { sheet: sheet.sheet, label: sheet.label, file: pick.file, pages, detectedQuestions: questions.length, expectedQuestions: sheet.expectedQuestions, diff, questions },
        null,
        2,
      ),
    )
    console.log(
      `${sheet.sheet}: plik="${pick.file}" stron=${pages} wykryto=${questions.length} oczekiwano=${sheet.expectedQuestions} roznica=${diff >= 0 ? '+' : ''}${diff}`,
    )
    if (diff !== 0) {
      exceptions.push({
        sheet: sheet.sheet,
        reason: 'count-mismatch',
        detail: `wykryto ${questions.length} / oczekiwano ${sheet.expectedQuestions}`,
      })
    }
    const low = questions.filter((q) => q.confidence === 'low' || q.graphic)
    if (low.length > 0) {
      exceptions.push({
        sheet: sheet.sheet,
        reason: 'manual-review',
        detail: `pytania do recznej kontroli: ${low.map((q) => q.number).join(', ')}`,
      })
    }
  }
  writeFileSync(join(OUT_DIR, '_exceptions.json'), JSON.stringify({ exceptions }, null, 2))
  console.log(`\nRazem wykryto ${totalDetected} / oczekiwano ${totalExpected}. Raporty w scripts/archive/out/`)
  console.log(`Wyjatki (${exceptions.length}): scripts/archive/out/_exceptions.json`)
  if (missing > 0) {
    console.error(`Brak dopasowania dla ${missing} arkuszy.`)
    process.exit(1)
  }
}

main()
