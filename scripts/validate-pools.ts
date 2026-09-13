/**
 * Bramka walidacji pul: liczebnosc, rozlacznosc, pokrycie archiwum, poprawnosc kluczy.
 * Uruchomienie: node scripts/validate-pools.ts (exit != 0 przy bledach)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validatePools } from '../src/engine/variants/validate.ts'
import type { GeneratedTask } from '../src/domain/taskSeed.ts'
import { klasa1Tasks } from '../src/data/klasa1/tasks.ts'
import { klasa2Tasks } from '../src/data/klasa2/tasks.ts'
import { klasa3Tasks } from '../src/data/klasa3/tasks.ts'
import { klasa4Tasks } from '../src/data/klasa4/tasks.ts'
import { klasa1Generated } from '../src/data/generated/klasa1.ts'
import { klasa2Generated } from '../src/data/generated/klasa2.ts'
import { klasa3Generated } from '../src/data/generated/klasa3.ts'
import { klasa4Generated } from '../src/data/generated/klasa4.ts'

const HERE = dirname(fileURLToPath(import.meta.url))

function main(): void {
  const manifest = JSON.parse(readFileSync(join(HERE, 'archive', 'manifest.json'), 'utf8')) as {
    sheets: { sheet: string; grade: number; expectedQuestions: number }[]
  }
  const legacy = [...klasa1Tasks, ...klasa2Tasks, ...klasa3Tasks, ...klasa4Tasks]
  const generated: GeneratedTask[] = [
    ...klasa1Generated,
    ...klasa2Generated,
    ...klasa3Generated,
    ...klasa4Generated,
  ]
  const archivePairs = manifest.sheets.flatMap((s) =>
    Array.from({ length: s.expectedQuestions }, (_, i) => ({ sheet: s.sheet, number: i + 1 })),
  )
  const issues = validatePools(
    generated,
    legacy,
    [
      { grade: 1, pool: 'learn', minCount: 6 },
      { grade: 1, pool: 'quiz', minCount: 101 },
      { grade: 1, pool: 'exam', minCount: 264 },
      { grade: 2, pool: 'learn', minCount: 1 },
      { grade: 2, pool: 'quiz', minCount: 101 },
      { grade: 2, pool: 'exam', minCount: 275 },
      { grade: 3, pool: 'learn', minCount: 0 },
      { grade: 3, pool: 'quiz', minCount: 101 },
      { grade: 3, pool: 'exam', minCount: 224 },
      { grade: 4, pool: 'learn', minCount: 0 },
      { grade: 4, pool: 'quiz', minCount: 101 },
      { grade: 4, pool: 'exam', minCount: 285 },
    ],
    archivePairs,
  )

  // Laczne pule per klasa (legacy w learn) musza miec min. 101 zadan.
  for (const grade of [1, 2, 3, 4]) {
    const learnTotal =
      legacy.filter((t) => t.klasa === grade).length +
      generated.filter((t) => t.klasa === grade && t.pool === 'learn').length
    const quizTotal = generated.filter((t) => t.klasa === grade && t.pool === 'quiz').length
    const examTotal = generated.filter((t) => t.klasa === grade && t.pool === 'exam').length
    console.log(`klasa ${grade}: learn=${learnTotal} quiz=${quizTotal} exam=${examTotal}`)
    if (learnTotal < 101 || quizTotal < 101 || examTotal < 101) {
      issues.push({
        taskId: '-',
        rule: 'pool-size-total',
        message: `klasa ${grade} ma za mala laczna pule`,
      })
    }
  }

  const warnings = issues.filter((i) => i.rule === 'legacy-duplicate')
  const errors = issues.filter((i) => i.rule !== 'legacy-duplicate')
  for (const w of warnings) {
    console.warn(`ostrzezenie [${w.rule}] ${w.taskId}: ${w.message}`)
  }
  if (errors.length > 0) {
    console.error(`\nBledy walidacji (${errors.length}):`)
    for (const issue of errors.slice(0, 50)) {
      console.error(`- [${issue.rule}] ${issue.taskId}: ${issue.message}`)
    }
    process.exit(1)
  }
  console.log(`\nOK: ${generated.length} zadan generowanych, ${legacy.length} legacy, 0 bledow.`)
}

main()
