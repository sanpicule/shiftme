import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ToastContainer'
import { AuthForm } from './components/AuthForm'
import { InitialSetup } from './components/InitialSetup'
import { MainApp } from './components/MainApp'
import { InstallPrompt } from './components/InstallPrompt'
import { useUserSettings } from './hooks/useUserSettings'
import { LoadingSpinner } from './components/LoadingSpinner'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { userSettings, loading: settingsLoading } = useUserSettings()

  // Show loading until all necessary data is loaded
  if (authLoading || (user && settingsLoading) || (user && !userSettings)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="データを取得しています" />
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
    <>
      <MainApp />
      <InstallPrompt />
    </>
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