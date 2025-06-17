import React, { useState } from 'react'
import { Home, Settings, User, TrendingUp } from 'lucide-react'
import { Dashboard } from './Dashboard'
import { SettingsPage } from './SettingsPage'
import { ProfilePage } from './ProfilePage'
import { AnalyticsPage } from './AnalyticsPage'
import { PageTransition } from './PageTransition'
import { Layout } from './Layout'

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile'

export function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [isLoading, setIsLoading] = useState(false)

  const handlePageChange = async (page: Page) => {
    if (page === currentPage) return
    
    setIsLoading(true)
    
    // Simulate page loading time for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setCurrentPage(page)
    setIsLoading(false)
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
      <PageTransition isLoading={isLoading}>
        {renderPage()}
      </PageTransition>
    </Layout>
  )
}