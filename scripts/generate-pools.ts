/**
 * Deterministyczne generowanie pul learn/quiz/exam dla klas 1-4.
 * Uruchomienie: node scripts/generate-pools.ts
 * Wynik: src/data/generated/klasa{1,2,3,4}.ts
 *
 * - exam: dokladnie jedna parafraza kazdego pytania archiwalnego (264/275/224/285),
 * - quiz: 101 wariantow na klase,
 * - learn: uzupelnienie bazy legacy do 101 na klase (kl1 +6, kl2 +1, kl3 +0, kl4 +61).
 * Generator jest w pelni deterministyczny (seedowany PRNG, sortowanie po ID).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatePoolTasks } from '../src/engine/variants/generate.ts'
import { fingerprintOf } from '../src/engine/variants/validate.ts'
import type { ArchivePair } from '../src/engine/variants/generate.ts'
import type { GeneratedTask } from '../src/domain/taskSeed.ts'
import { klasa1Tasks } from '../src/data/klasa1/tasks.ts'
import { klasa2Tasks } from '../src/data/klasa2/tasks.ts'
import { klasa3Tasks } from '../src/data/klasa3/tasks.ts'
import { klasa4Tasks } from '../src/data/klasa4/tasks.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT_DIR = join(ROOT, 'src', 'data', 'generated')

interface ManifestSheet {
  sheet: string
  grade: number
  label: string
  expectedQuestions: number
}

const LEGACY_COUNTS: Record<number, number> = { 1: 95, 2: 100, 3: 112, 4: 110 }
const QUIZ_COUNT = 101
const LEARN_MIN = 101

function normFp(task: GeneratedTask): string {
  const norm = (v: string) => v.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pl')
  const options = Object.values(task.opcje)
    .filter((v): v is string => typeof v === 'string')
    .map(norm)
    .sort()
  return JSON.stringify([norm(task.tresc), options])
}

function serialize(tasks: GeneratedTask[], exportName: string): string {
  const sorted = [...tasks].sort((a, b) => (a.id < b.id ? -1 : 1))
  const body = sorted.map((t) => `  ${JSON.stringify(t)},`).join('\n')
  return `import type { GeneratedTask } from '../../domain/taskSeed'\n\n/** Plik generowany — nie edytuj recznie. Zrodlo: node scripts/generate-pools.ts */\nexport const ${exportName}: GeneratedTask[] = [\n${body}\n]\n`
}

function legacyFp(): Set<string> {
  const out = new Set<string>()
  for (const t of [...klasa1Tasks, ...klasa2Tasks, ...klasa3Tasks, ...klasa4Tasks]) {
    out.add(fingerprintOf(t.tresc, t.opcje))
  }
  return out
}

function main(): void {
  const manifest = JSON.parse(readFileSync(join(HERE, 'archive', 'manifest.json'), 'utf8')) as {
    sheets: ManifestSheet[]
  }
  mkdirSync(OUT_DIR, { recursive: true })
  // Jeden globalny zbiór odcisków: generowane zadania są unikalne w skali wszystkich klas i pul.
  const avoid = new Set<string>(legacyFp())
  const track = (tasks: GeneratedTask[]) => {
    for (const t of tasks) avoid.add(normFp(t))
  }

  let grandTotal = 0
  for (const grade of [1, 2, 3, 4]) {
    const sheets = manifest.sheets.filter((s) => s.grade === grade)
    const pairs: ArchivePair[] = []
    for (const s of sheets) {
      for (let n = 1; n <= s.expectedQuestions; n++) {
        pairs.push({ sheet: s.sheet, label: s.label, number: n })
      }
    }
    const learnCount = Math.max(0, LEARN_MIN - (LEGACY_COUNTS[grade] ?? 0))
    const exam = generatePoolTasks(
      { grade: grade as 1 | 2 | 3 | 4, pool: 'exam', count: pairs.length, archivePairs: pairs },
      avoid,
    )
    track(exam)
    const quiz = generatePoolTasks(
      { grade: grade as 1 | 2 | 3 | 4, pool: 'quiz', count: QUIZ_COUNT },
      avoid,
    )
    track(quiz)
    const learn = generatePoolTasks(
      { grade: grade as 1 | 2 | 3 | 4, pool: 'learn', count: learnCount },
      avoid,
    )
    track(learn)

    const all = [...exam, ...quiz, ...learn]

    const exportName = `klasa${grade}Generated`
    writeFileSync(join(OUT_DIR, `klasa${grade}.ts`), serialize(all, exportName))
    grandTotal += all.length
    console.log(
      `klasa ${grade}: exam=${exam.length} quiz=${quiz.length} learn-topup=${learn.length} (legacy=${LEGACY_COUNTS[grade]})`,
    )
  }
  console.log(`Razem nowych zadan: ${grandTotal}`)
}

main()
