import React, { useState } from 'react'
import { LogOut, Home, Settings, User, TrendingUp } from 'lucide-react'
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
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex overflow-hidden">
      {/* Sidebar - Desktop only, always visible */}
      <div className="hidden md:block w-64 h-screen glass-nav border-r border-white/20 shadow-glass">
        {/* Sidebar Header */}
        <div className="flex items-center p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
                <div className="relative group glass-shine">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500/30 to-gray-600/30 backdrop-blur-sm border border-gray-400/30 rounded-xl flex items-center justify-center shadow-glass-glow group-hover:shadow-glass-glow group-hover:scale-105 transition-all duration-300">
                    <img src="/shiftme-icon.png" alt="Shiftme" className="w-8 h-8 rounded-lg" />
                  </div>
                </div>
            <h1 className="text-xl font-black glass-text-strong">
              Shiftme
            </h1>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-80px)] glass-scrollbar">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium transition-all duration-300 group relative glass-shine
                  ${isActive 
                    ? 'bg-glass-white-strong text-white border border-white/30 shadow-glass-glow' 
                    : 'glass-text hover:text-white hover:bg-glass-white-weak'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-xl transition-all duration-300 grid place-items-center backdrop-blur-sm ${isActive ? 'bg-glass-black border border-white/30' : 'bg-glass-white-weak border border-white/10'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'glass-icon' : 'glass-icon group-hover:text-white/90'}`} />
                </div>
                <span className="text-shadow">{item.name}</span>
              </button>
            )
          })}
          
          <div className="pt-4 border-t border-white/20">
            <button
              onClick={openLogoutModal}
              className="w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium glass-text hover:text-red-400 hover:bg-red-500/20 transition-all duration-300 group glass-shine"
            >
              <div className="w-10 h-10 rounded-xl bg-glass-white-weak border border-white/10 transition-all duration-300 grid place-items-center group-hover:bg-red-500/20 group-hover:border-red-400/30">
                <LogOut className="w-5 h-5 glass-icon group-hover:text-red-400 transition-colors" />
              </div>
              <span className="text-shadow">ログアウト</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden glass-nav border-b border-white/20 shadow-glass">
          <div className="flex items-center px-4 py-3">
            <div className="flex items-center space-x-3">
                <div className="relative group glass-shine">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-500/30 to-gray-600/30 backdrop-blur-sm border border-gray-400/30 rounded-lg flex items-center justify-center shadow-glass-glow">
                    <img src="/shiftme-icon.png" alt="Shiftme" className="w-6 h-6 rounded-md" />
                  </div>
                </div>
              <h1 className="text-lg font-black glass-text-strong">
                Shiftme
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="h-full overflow-y-auto p-6 md:p-8 md:py-10 pb-36 md:pb-8 glass-scrollbar">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-white/20 shadow-glass z-40">
          <div className="grid grid-cols-5 gap-1 p-2 pb-6">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`
                    flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 glass-shine
                    ${isActive 
                      ? 'glass-text-strong bg-glass-white-strong border border-white/30' 
                      : 'glass-text hover:text-white hover:bg-glass-white-weak'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'glass-icon' : 'glass-icon'}`} />
                </button>
              )
            })}
            
            {/* Logout Button */}
            <button
              onClick={openLogoutModal}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 glass-text hover:text-red-400 hover:bg-red-500/20 glass-shine"
            >
              <LogOut className="w-6 h-6 glass-icon" />
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