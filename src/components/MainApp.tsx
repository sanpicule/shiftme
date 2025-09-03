import React, { useState } from 'react'
import { Home, Settings, User, TrendingUp } from 'lucide-react'
import { Dashboard } from './Dashboard'
import { SettingsPage } from './SettingsPage'
import { ProfilePage } from './ProfilePage'
import { AnalyticsPage } from './AnalyticsPage'
import { Layout } from './Layout'

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile'

export function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  const handlePageChange = (page: Page) => {
    if (page === currentPage) return
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'analytics':
        return <AnalyticsPage />
      case 'settings':
        return <SettingsPage />
      case 'profile':
        return <ProfilePage onPageChange={handlePageChange} />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      <div className="animate-fadeIn">
        {renderPage()}
      </div>
    </Layout>
  )
}