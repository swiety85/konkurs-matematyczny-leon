export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type OptionKey = 'A' | 'B' | 'C' | 'D'

export type TaskType = 'single' | 'multi' | 'none' | 'open'

export type TopicId =
  | 'liczby-ciagi'
  | 'dodawanie-odejmowanie'
  | 'mnozenie-dzielenie'
  | 'podzielnosc'
  | 'zadania-tekstowe'
  | 'czas-miary'
  | 'geometria'
  | 'logika'
  | 'liczby-wielocyfrowe'
  | 'kolejnosc-dzialan'
  | 'ulamki'
  | 'pola-jednostki'

export type SessionMode = 'nauka' | 'quiz' | 'symulacja' | 'powtorki' | 'diagnoza'

export interface Task {
  id: string
  klasa: Grade
  dzial: TopicId
  typ: TaskType
  tresc: string
  opcje: Partial<Record<OptionKey, string>>
  poprawne: OptionKey[]
  wyjasnienie: string
  zrodlo: string
  trudnosc: 1 | 2 | 3
  hint?: string
  openAnswer?: string
}

export interface TopicMeta {
  id: TopicId
  nazwa: string
  opis: string
  klasy: Grade[]
  teoria: string
  przyklad: string
  gradeContent?: Partial<Record<Grade, { teoria: string; przyklad: string }>>
}

export interface GradeMeta {
  klasa: Grade
  nazwa: string
  opis: string
  dzialy: TopicId[]
  dostepna: boolean
}

export interface AttemptRecord {
  taskId: string
  dzial: TopicId
  selected: OptionKey[]
  openText?: string
  correct: boolean
  points: number
  maxPoints: number
  timestamp: number
}

export interface SessionRecord {
  id: string
  mode: SessionMode
  klasa: Grade
  startedAt: number
  finishedAt: number
  durationSec: number
  score: number
  maxScore: number
  attempts: AttemptRecord[]
}

export interface TopicStats {
  attempts: number
  correct: number
  points: number
  maxPoints: number
  lastAttemptAt: number | null
  nextReviewAt: number | null
  mastery: number
}

export interface Badge {
  id: string
  nazwa: string
  opis: string
  earnedAt: number
}

export interface UserProfile {
  name: string
  klasa: Grade
  createdAt: number
  totalStudySec: number
  topicStats: Partial<Record<TopicId, TopicStats>>
  sessions: SessionRecord[]
  badges: Badge[]
  reviewQueue: string[]
}
