import type { Grade, IllustrationSpec, OptionKey, Task, TaskType, TopicId } from '../types'

export type TaskPool = 'learn' | 'quiz' | 'exam'

export type VariantKind = 'static' | 'numeric' | 'sequence' | 'word-problem'

export interface ArchiveRef {
  /** Stabilny identyfikator arkusza, np. 'kl1-2025-wiosna'. */
  sheet: string
  /** Numer pytania w arkuszu źródłowym (1-based). */
  number: number
}

export interface VariantRecipe {
  kind: VariantKind
  params: Record<string, number | string | number[]>
}

export interface TaskSeed {
  /** Stabilny klucz migracji — odpowiada dotychczasowemu Task.id. */
  id: string
  klasa: Grade
  dzial: TopicId
  typ: TaskType
  trudnosc: 1 | 2 | 3
  tresc: string
  opcje: Partial<Record<OptionKey, string>>
  poprawne: OptionKey[]
  wyjasnienie: string
  zrodlo: string
  hint?: string
  illustration?: IllustrationSpec
  archiveRef?: ArchiveRef
  recipe?: VariantRecipe
}

export interface GeneratedTask extends Task {
  /** Id seeda, z którego powstało zadanie. */
  seedId: string
  pool: TaskPool
  /** 0 = parafraza egzaminacyjna, 1..n = warianty nauki/quizu. */
  variant: number
  archiveRef?: ArchiveRef
}

export function toSeed(task: Task, archiveRef?: ArchiveRef): TaskSeed {
  return {
    id: task.id,
    klasa: task.klasa,
    dzial: task.dzial,
    typ: task.typ,
    trudnosc: task.trudnosc,
    tresc: task.tresc,
    opcje: task.opcje,
    poprawne: task.poprawne,
    wyjasnienie: task.wyjasnienie,
    zrodlo: task.zrodlo,
    hint: task.hint,
    illustration: task.illustration,
    archiveRef,
  }
}
