import React, { useState } from 'react'
import { LogOut, PiggyBank, Home, Settings, User, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { LogoutConfirmModal } from './LogoutConfirmModal'

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile'

interface LayoutProps {
  children: React.ReactNode
  currentPage: Page
  onPageChange: (page: Page) => void
}

const navigation: Array<{ id: Page; name: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', name: 'ダッシュボード', icon: Home },
  { id: 'analytics', name: '分析', icon: TrendingUp },
  { id: 'settings', name: '設定', icon: Settings },
  { id: 'profile', name: 'プロフィール', icon: User },
]

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { signOut } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
      // Force reload even if logout fails
      window.location.reload()
    }
  }

  const openLogoutModal = () => setShowLogoutModal(true)
  const closeLogoutModal = () => setShowLogoutModal(false)

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* Sidebar - Desktop only, always visible */}
      <div className="hidden md:block w-64 h-screen bg-white border-r border-gray-200 shadow-lg">
        {/* Sidebar Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Shiftme
            </h1>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)]">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-xl transition-all duration-300 grid place-items-center ${isActive ? 'bg-blue-200' : 'bg-gray-100'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                </div>
                <span>{item.name}</span>
              </button>
            )
          })}
          
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={openLogoutModal}
              className="w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 transition-all duration-300 grid place-items-center">
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600 transition-colors" />
              </div>
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-center px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <PiggyBank className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-lg font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Shiftme
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="h-full overflow-y-auto p-6 md:p-8 md:py-10 pb-36 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="grid grid-cols-5 gap-1 p-2 pb-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`
                    flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300
                    ${isActive 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                </button>
              )
            })}
            
            {/* Logout Button */}
            <button
              onClick={openLogoutModal}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirm Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={closeLogoutModal}
        onConfirm={handleSignOut}
      />
    </div>
  )
}