import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import PlannerPage from './pages/PlannerPage'
import MeasurementsPage from './pages/MeasurementsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import GitHubCallbackPage from './pages/GitHubCallbackPage'
import DemoLimitModal from './components/DemoLimitModal'

function AppShell() {
  const { token } = useAuth()
  return (
    <>
      <DemoLimitModal />
      <Routes>
        <Route path="/login"    element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <SignUpPage />} />
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
