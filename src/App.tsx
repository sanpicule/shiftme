import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useEffect, useState } from 'react'
import { ToastProvider } from './components/ToastContainer'
import { AuthForm } from './components/AuthForm'
import { InitialSetup } from './components/InitialSetup'
import { MainApp } from './components/MainApp'
import { InstallPrompt } from './components/InstallPrompt'
import { UserSettingsProvider, useUserSettings } from './hooks/useUserSettings.tsx'
import { LoadingSpinner } from './components/LoadingSpinner'

import { DataProvider } from './contexts/DataContext';

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { userSettings, loading: settingsLoading } = useUserSettings()
  const [minLoadingPassed, setMinLoadingPassed] = useState(false)

  useEffect(() => {
    if (!authLoading && user && settingsLoading) {
      setMinLoadingPassed(false)
      return
    }

    if (!authLoading && user && !settingsLoading) {
      const timer = setTimeout(() => setMinLoadingPassed(true), 800)
      return () => clearTimeout(timer)
    }

    setMinLoadingPassed(false)
  }, [authLoading, user, settingsLoading])

  // Show loading only during auth check
  if (authLoading || settingsLoading || !minLoadingPassed) {
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
        <UserSettingsProvider>
          <AppContent />
        </UserSettingsProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App