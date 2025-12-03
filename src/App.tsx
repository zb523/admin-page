import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/components/AuthGuard'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HistoryDetailPage } from '@/pages/HistoryDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  // useAuth initializes auth on mount:
  // 1. getSession() to check existing session
  // 2. fetchProfile() if session exists
  // 3. Sets up onAuthStateChange for future events
  // 4. Handles redirects based on auth state
  useAuth()

  return (
    <AuthGuard>
      <LanguageSwitcher />
      <ThemeToggle />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<HistoryDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthGuard>
  )
}

export default App
