import React from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ToastContainer'
import { AuthForm } from './components/AuthForm'
import { InitialSetup } from './components/InitialSetup'
import { MainApp } from './components/MainApp'
import { InstallPrompt } from './components/InstallPrompt'
import { useUserSettings } from './hooks/useUserSettings'

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const { userSettings, loading: settingsLoading } = useUserSettings()

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-800">読み込み中...</p>
            <p className="text-sm text-gray-500">データを取得しています</p>
          </div>
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

  if (!userSettings?.setup_completed) {
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