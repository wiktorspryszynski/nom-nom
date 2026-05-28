import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { GITHUB_ONLY } from './config'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import PlannerPage from './pages/PlannerPage'
import MeasurementsPage from './pages/MeasurementsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import GitHubCallbackPage from './pages/GitHubCallbackPage'
import DemoLimitModal from './components/DemoLimitModal'

function RegisterRoute() {
  const { token } = useAuth()
  const { search } = useLocation()
  const viaGitHub = new URLSearchParams(search).get('via') === 'github'
  if (token) return <Navigate to="/" replace />
  if (GITHUB_ONLY && !viaGitHub) return <Navigate to="/login" replace />
  return <SignUpPage />
}

function AppShell() {
  const { token } = useAuth()
  return (
    <>
      <DemoLimitModal />
      <Routes>
        <Route path="/login"    element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={<RegisterRoute />} />
        {/* GitHub OAuth callback — always accessible regardless of auth state */}
        <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
        {token ? (
          <>
            <Route path="/"             element={<DashboardPage />} />
            <Route path="/planner"      element={<PlannerPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="*"             element={<NotFoundPage />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
