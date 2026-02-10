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

  // Show loading only during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <InstallPrompt />
      </>
    )
  }

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Show InitialSetup only when we're sure the user hasn't completed setup
  // and we're not in a loading state
  if (userSettings === null && !settingsLoading) {
    return <InitialSetup />
  }
  
  // If userSettings exists but setup is not completed, show InitialSetup
  if (userSettings && !userSettings.setup_completed) {
    return <InitialSetup />
  }

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