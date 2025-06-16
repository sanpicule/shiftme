import React from 'react'
import { LogOut, PiggyBank, Home, Settings, User, TrendingUp, Menu, X, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onPageChange: (page: string) => void
}

const navigation = [
  { id: 'dashboard', name: 'ダッシュボード', icon: Home },
  { id: 'analytics', name: '分析', icon: TrendingUp },
  { id: 'settings', name: '設定', icon: Settings },
  { id: 'profile', name: 'プロフィール', icon: User },
]

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                  <PiggyBank className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Shiftme
                </h1>
                <p className="text-xs text-gray-500 font-medium">Smart Money Manager</p>
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
              onClick={signOut}
              className="hidden md:flex items-center space-x-3 text-gray-500 hover:text-red-600 transition-all duration-300 px-4 py-3 rounded-2xl hover:bg-red-50/60 hover:shadow-lg hover:shadow-red-500/10 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">ログアウト</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 relative z-50"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-fadeIn">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white">Shiftme</h1>
                  <p className="text-xs text-white/80">Smart Money Manager</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`
                      w-full flex items-center space-x-4 px-6 py-5 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 animate-slideInUp
                      ${isActive 
                        ? 'bg-white/20 backdrop-blur-sm text-white shadow-xl' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      }
                    `}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-lg font-semibold">{item.name}</span>
                      <div className="text-sm opacity-70">
                        {item.id === 'dashboard' && '収支管理・カレンダー'}
                        {item.id === 'analytics' && 'データ分析・統計'}
                        {item.id === 'settings' && '各種設定・管理'}
                        {item.id === 'profile' && 'アカウント・実績'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Mobile Logout */}
            <div className="p-6 border-t border-white/20">
              <button
                onClick={() => {
                  signOut()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-white/80 hover:text-white hover:bg-red-500/20 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-red-500/20">
                  <LogOut className="w-6 h-6" />
                </div>
                <span className="text-lg font-semibold">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}