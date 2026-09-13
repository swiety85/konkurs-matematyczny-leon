import type {
  AttemptRecord,
  Badge,
  Grade,
  SessionRecord,
  TopicId,
  TopicStats,
  UserProfile,
} from '../types'

const LEGACY_STORAGE_KEY = 'leon-trener-profile-v1'
const PROFILE_INDEX_KEY = 'leon-trener-students-v2'
const PROFILE_KEY_PREFIX = 'leon-trener-student-v2:'
const DAY_MS = 24 * 60 * 60 * 1000

export interface StudentProfileRef {
  id: string
  name: string
  klasa: Grade
  createdAt: number
}

export const MASTERY_THRESHOLD = 0.8
export const REVIEW_INTERVALS_DAYS = [1, 3, 7] as const

export function emptyTopicStats(): TopicStats {
  return {
    attempts: 0,
    correct: 0,
    points: 0,
    maxPoints: 0,
    lastAttemptAt: null,
    nextReviewAt: null,
    mastery: 0,
  }
}

export function createDefaultProfile(name = 'Uczeń', klasa: Grade = 3): UserProfile {
  return {
    name,
    klasa,
    createdAt: Date.now(),
    totalStudySec: 0,
    topicStats: {},
    sessions: [],
    badges: [],
    reviewQueue: [],
  }
}

function profileKey(id: string): string {
  return `${PROFILE_KEY_PREFIX}${id}`
}

function newStudentId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `student-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function saveStudentIndex(students: StudentProfileRef[]): void {
  localStorage.setItem(PROFILE_INDEX_KEY, JSON.stringify(students))
}

function toStudentRef(id: string, profile: UserProfile): StudentProfileRef {
  return { id, name: profile.name, klasa: profile.klasa, createdAt: profile.createdAt }
}

export function loadStudents(): StudentProfileRef[] {
  try {
    const raw = localStorage.getItem(PROFILE_INDEX_KEY)
    if (raw) return JSON.parse(raw) as StudentProfileRef[]

    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyRaw) return []

    const legacyProfile = {
      ...createDefaultProfile(),
      ...JSON.parse(legacyRaw),
    } as UserProfile
    const id = newStudentId()
    localStorage.setItem(profileKey(id), JSON.stringify(legacyProfile))
    const students = [toStudentRef(id, legacyProfile)]
    saveStudentIndex(students)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return students
  } catch {
    return []
  }
}

export function createStudent(name: string, klasa: Grade): {
  student: StudentProfileRef
  profile: UserProfile
} {
  const id = newStudentId()
  const profile = createDefaultProfile(name.trim(), klasa)
  const student = toStudentRef(id, profile)
  localStorage.setItem(profileKey(id), JSON.stringify(profile))
  saveStudentIndex([...loadStudents(), student])
  return { student, profile }
}

export function loadProfile(id: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(id))
    if (!raw) return null
    return { ...createDefaultProfile(), ...JSON.parse(raw) } as UserProfile
  } catch {
    return null
  }
}

export function saveProfile(id: string, profile: UserProfile): void {
  localStorage.setItem(profileKey(id), JSON.stringify(profile))
  const students = loadStudents()
  const student = toStudentRef(id, profile)
  const index = students.findIndex((item) => item.id === id)
  if (index === -1) students.push(student)
  else students[index] = student
  saveStudentIndex(students)
}

export function exportProfile(profile: UserProfile): string {
  return JSON.stringify(profile, null, 2)
}

export function importProfile(json: string): UserProfile {
  const data = JSON.parse(json) as UserProfile
  if (!data.name || !data.klasa) throw new Error('Nieprawidłowy plik profilu')
  return { ...createDefaultProfile(), ...data }
}

export function resetProfile(id: string, name?: string, klasa?: Grade): UserProfile {
  const profile = createDefaultProfile(name, klasa)
  saveProfile(id, profile)
  return profile
}

function computeMastery(stats: TopicStats): number {
  if (stats.maxPoints === 0) return 0
  return Math.min(1, stats.points / stats.maxPoints)
}

function nextReviewFromMastery(mastery: number, now: number): number {
  if (mastery >= MASTERY_THRESHOLD) return now + REVIEW_INTERVALS_DAYS[2] * DAY_MS
  if (mastery >= 0.5) return now + REVIEW_INTERVALS_DAYS[1] * DAY_MS
  return now + REVIEW_INTERVALS_DAYS[0] * DAY_MS
}

export function applyAttempts(profile: UserProfile, attempts: AttemptRecord[]): UserProfile {
  const topicStats = { ...profile.topicStats }
  const now = Date.now()

  for (const attempt of attempts) {
    const prev = topicStats[attempt.dzial] ?? emptyTopicStats()
    const updated: TopicStats = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (attempt.correct ? 1 : 0),
      points: prev.points + attempt.points,
      maxPoints: prev.maxPoints + attempt.maxPoints,
      lastAttemptAt: now,
      nextReviewAt: null,
      mastery: 0,
    }
    updated.mastery = computeMastery(updated)
    updated.nextReviewAt = nextReviewFromMastery(updated.mastery, now)
    topicStats[attempt.dzial] = updated
  }

  return { ...profile, topicStats }
}

export function addSession(
  studentId: string,
  profile: UserProfile,
  session: SessionRecord,
): UserProfile {
  let next = applyAttempts(profile, session.attempts)
  next = {
    ...next,
    totalStudySec: next.totalStudySec + session.durationSec,
    sessions: [session, ...next.sessions].slice(0, 100),
  }
  next = awardBadges(next)
  saveProfile(studentId, next)
  return next
}

function awardBadges(profile: UserProfile): UserProfile {
  const badges: Badge[] = [...profile.badges]
  const has = (id: string) => badges.some((b) => b.id === id)
  const now = Date.now()
  const add = (id: string, nazwa: string, opis: string) => {
    if (!has(id)) badges.push({ id, nazwa, opis, earnedAt: now })
  }

  if (profile.sessions.length >= 1) add('pierwszy-test', 'Pierwszy start', 'Ukończyłeś pierwszą sesję!')
  if (profile.sessions.some((s) => s.mode === 'symulacja')) {
    add('symulacja', 'Jak na konkursie', 'Przeszedłeś pełną symulację konkursową.')
  }
  const mnozenie = profile.topicStats['mnozenie-dzielenie']
  if (mnozenie && mnozenie.mastery >= MASTERY_THRESHOLD && mnozenie.attempts >= 8) {
    add('mistrz-tabliczki', 'Mistrz Tabliczki', 'Osiągnąłeś biegłość w mnożeniu i dzieleniu.')
  }
  const weakCount = Object.values(profile.topicStats).filter(
    (s) => s && s.mastery < 0.5 && s.attempts > 0,
  ).length
  if (profile.sessions.length >= 5 && weakCount === 0 && Object.keys(profile.topicStats).length >= 4) {
    add('wszechstronny', 'Wszechstronny matematyk', 'Nie masz już bardzo słabych działów.')
  }
  if (profile.totalStudySec >= 60 * 60) {
    add('godzina-nauki', 'Godzina mocy', 'Spędziłeś łącznie godzinę na nauce.')
  }

  return { ...profile, badges }
}

export function getWeakTopics(profile: UserProfile, limit = 3): TopicId[] {
  return (Object.entries(profile.topicStats) as [TopicId, TopicStats][])
    .filter(([, s]) => s.attempts > 0)
    .sort((a, b) => a[1].mastery - b[1].mastery)
    .slice(0, limit)
    .map(([id]) => id)
}

export function getDueTopics(profile: UserProfile, now = Date.now()): TopicId[] {
  return (Object.entries(profile.topicStats) as [TopicId, TopicStats][])
    .filter(([, s]) => s.nextReviewAt != null && s.nextReviewAt <= now)
    .sort((a, b) => (a[1].nextReviewAt ?? 0) - (b[1].nextReviewAt ?? 0))
    .map(([id]) => id)
}

export function updateProfileName(
  studentId: string,
  profile: UserProfile,
  name: string,
  klasa: Grade,
): UserProfile {
  const next = { ...profile, name, klasa }
  saveProfile(studentId, next)
  return next
}
