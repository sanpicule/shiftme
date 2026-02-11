import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ToastContainer'
import { AuthForm } from './components/AuthForm'
import { InitialSetup } from './components/InitialSetup'
import { MainApp } from './components/MainApp'
import { InstallPrompt } from './components/InstallPrompt'
import { useUserSettings } from './hooks/useUserSettings'
import { LoadingSpinner } from './components/LoadingSpinner'

import { DataProvider } from './contexts/DataContext';

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { userSettings, loading: settingsLoading } = useUserSettings()

  // Combine all loading states into one - show loading until everything is ready
  const isInitializing = authLoading || (user && settingsLoading)

  // Show single loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Only show auth form when we're sure user is not authenticated
  if (!user) {
    return (
      <>
        <AuthForm />
        <InstallPrompt />
      </>
    )
  }

  // At this point, user is authenticated and settings are loaded
  // Show InitialSetup if user hasn't completed setup
  if (!userSettings || !userSettings.setup_completed) {
    return <InitialSetup />
  }

  // User is authenticated and setup is complete - show main app
  return (
    <DataProvider>
      <MainApp />
      <InstallPrompt />
    </DataProvider>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App