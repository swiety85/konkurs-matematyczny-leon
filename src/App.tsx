import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProfileProvider } from './context/ProfileContext'
import { DiagnosePage } from './pages/DiagnosePage'
import { ExamPage } from './pages/ExamPage'
import { HomePage } from './pages/HomePage'
import { LearnPage } from './pages/LearnPage'
import { ParentPage } from './pages/ParentPage'
import { ProgressPage } from './pages/ProgressPage'
import { QuizPage } from './pages/QuizPage'
import { ReviewPage } from './pages/ReviewPage'

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/nauka" element={<LearnPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/symulacja" element={<ExamPage />} />
            <Route path="/powtorki" element={<ReviewPage />} />
            <Route path="/postepy" element={<ProgressPage />} />
            <Route path="/diagnoza" element={<DiagnosePage />} />
            <Route path="/rodzic" element={<ParentPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ProfileProvider>
  )
}
