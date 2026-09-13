import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { StudentChooser } from '../components/StudentChooser'
import type { Grade, SessionRecord, UserProfile } from '../types'
import {
  addSession,
  createStudent,
  exportProfile,
  importProfile,
  loadProfile,
  loadStudents,
  resetProfile,
  saveProfile,
  updateProfileName,
  type StudentProfileRef,
} from '../engine/storage'

interface ProfileContextValue {
  profile: UserProfile
  setNameAndGrade: (name: string, klasa: Grade) => void
  recordSession: (session: SessionRecord) => void
  doExport: () => string
  doImport: (json: string) => void
  doReset: () => void
  addStudent: (name: string, klasa: Grade) => void
  showStudentChooser: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<StudentProfileRef[]>(() => loadStudents())
  const [studentId, setStudentId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const refreshStudents = useCallback(() => setStudents(loadStudents()), [])

  const selectStudent = useCallback((id: string) => {
    const selectedProfile = loadProfile(id)
    if (!selectedProfile) {
      setStudents(loadStudents())
      return
    }
    setStudentId(id)
    setProfile(selectedProfile)
  }, [])

  const addStudent = useCallback((name: string, klasa: Grade) => {
    const created = createStudent(name, klasa)
    setStudents(loadStudents())
    setStudentId(created.student.id)
    setProfile(created.profile)
  }, [])

  const setNameAndGrade = useCallback((name: string, klasa: Grade) => {
    if (!studentId) return
    setProfile((prev) => (prev ? updateProfileName(studentId, prev, name, klasa) : prev))
    refreshStudents()
  }, [refreshStudents, studentId])

  const recordSession = useCallback((session: SessionRecord) => {
    if (!studentId) return
    setProfile((prev) => (prev ? addSession(studentId, prev, session) : prev))
  }, [studentId])

  const doExport = useCallback(() => (profile ? exportProfile(profile) : ''), [profile])

  const doImport = useCallback((json: string) => {
    if (!studentId) return
    const next = importProfile(json)
    saveProfile(studentId, next)
    setProfile(next)
    refreshStudents()
  }, [refreshStudents, studentId])

  const doReset = useCallback(() => {
    if (!profile || !studentId) return
    setProfile(resetProfile(studentId, profile.name, profile.klasa))
    refreshStudents()
  }, [profile, refreshStudents, studentId])

  const showStudentChooser = useCallback(() => {
    refreshStudents()
    setStudentId(null)
    setProfile(null)
  }, [refreshStudents])

  const value = useMemo(
    () =>
      profile
        ? {
            profile,
            setNameAndGrade,
            recordSession,
            doExport,
            doImport,
            doReset,
            addStudent,
            showStudentChooser,
          }
        : null,
    [
      profile,
      setNameAndGrade,
      recordSession,
      doExport,
      doImport,
      doReset,
      addStudent,
      showStudentChooser,
    ],
  )

  if (!profile || !value) {
    return <StudentChooser students={students} onSelect={selectStudent} onCreate={addStudent} />
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// Provider i hook współdzielą ten sam prywatny kontekst; rozdzielenie plików zaciemniłoby ten mały moduł.
// oxlint-disable-next-line react/only-export-components
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile musi być użyty wewnątrz ProfileProvider')
  return ctx
}
