import React from 'react'
import { LogOut, PiggyBank, Home, Settings, User, TrendingUp, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile'

interface LayoutProps {
  children: React.ReactNode
  currentPage: Page
  onPageChange: (page: Page) => void
}

const navigation = [
  { id: 'dashboard', name: 'ダッシュボード', icon: Home },
  { id: 'analytics', name: '分析', icon: TrendingUp },
  { id: 'settings', name: '設定', icon: Settings },
  { id: 'profile', name: 'プロフィール', icon: User },
]

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
      // Force reload even if logout fails
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="relative group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                  <PiggyBank className="w-5 h-5 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Shiftme
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`
                      relative flex items-center space-x-3 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 scale-105' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 hover:shadow-lg hover:shadow-black/5 hover:scale-105'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-20 animate-pulse"></div>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Desktop Logout */}
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center space-x-3 text-gray-500 hover:text-red-600 transition-all duration-300 px-4 py-3 rounded-2xl hover:bg-red-50/60 hover:shadow-lg hover:shadow-red-500/10 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-lg shadow-black/5 z-40 pb-4">
        <div className="grid grid-cols-4 gap-1 p-2">
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
                    ? 'text-blue-600 bg-blue-50/80' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-xs font-medium mt-1">{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}