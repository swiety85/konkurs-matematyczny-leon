/**
 * Migracja 347 dotychczasowych zadan do seedow z jawna linia pochodzenia.
 * Uruchomienie: node scripts/migrate-seeds.ts
 * Wynik: src/data/seeds/seeds.json (seedId = dotychczasowe Task.id, pula = learn).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT = join(ROOT, 'src', 'data', 'seeds', 'seeds.json')

const FILES = [
  'src/data/klasa1/tasks.ts',
  'src/data/klasa2/tasks.ts',
  'src/data/klasa3/tasks.ts',
  'src/data/klasa4/tasks.ts',
]

function parseArchiveRef(zrodlo: string, klasa: number): { sheet: string; number: number } | undefined {
  const m = zrodlo.match(/(Wiosna|Jesie[nń])\s+(20\d\d)\s*\/\s*zad\.?\s*(\d+)/i)
  if (!m) return undefined
  const season = m[1].toLowerCase().startsWith('wios') ? 'wiosna' : 'jesien'
  return { sheet: `kl${klasa}-${m[2]}-${season}`, number: Number(m[3]) }
}

function main(): void {
  const seeds: unknown[] = []
  for (const rel of FILES) {
    const text = readFileSync(join(ROOT, rel), 'utf8')
    const re = /id:\s*'([^']+)'[\s\S]*?klasa:\s*(\d)[\s\S]*?dzial:\s*'([^']+)'[\s\S]*?typ:\s*'([^']+)'[\s\S]*?zrodlo:\s*'([^']+)'/g
    let m: RegExpExecArray | null
    let count = 0
    while ((m = re.exec(text)) !== null) {
      const [, id, klasaRaw, dzial, typ, zrodlo] = m
      const klasa = Number(klasaRaw)
      seeds.push({
        seedId: id,
        klasa,
        dzial,
        typ,
        zrodlo,
        pool: 'learn',
        archiveRef: parseArchiveRef(zrodlo, klasa),
      })
      count += 1
    }
    console.log(`${rel}: seedow=${count}`)
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ count: seeds.length, seeds }, null, 2))
  console.log(`Zapisano ${OUT} (${seeds.length} seedow)`)
  if (seeds.length === 0) process.exit(1)
}

main()
