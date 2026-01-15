import React from 'react'
import { Home, Settings, User, TrendingUp } from 'lucide-react'

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile'

interface LayoutProps {
  children: React.ReactNode
  currentPage: Page
  onPageChange: (page: Page) => void
}

const navigation: Array<{ id: Page; name: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', name: 'ホーム', icon: Home },
  { id: 'analytics', name: '分析', icon: TrendingUp },
  { id: 'settings', name: '設定', icon: Settings },
  { id: 'profile', name: 'アカウント', icon: User },
]

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar - Desktop only, always visible */}
      <div className="hidden md:block w-64 h-screen bg-gray-800">
        {/* Sidebar Header */}
        <div className="flex items-center p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
              <div className="relative group glass-shine">
                <img src="/shiftme-icon.png" alt="Shiftme" className="w-8 h-8 rounded-lg" />
              </div>
            <h1 className="text-xl text-white font-bold">
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
                  w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold group relative glass-shine
                  ${isActive 
                    ? 'bg-white text-gray-800 border border-white/30 shadow-glass-glow' 
                    : 'text-white hover:text-white hover:bg-glass-white-weak'
                  }
                `}
              >
                <div>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-800' : 'text-white group-hover:text-white/90'}`} />
                </div>
                <span className="text-shadow">{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b border-gray-800/20">
          <div className="flex items-center px-4 py-3">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl text-gray-800 font-bold">
                Shiftme
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="h-full overflow-y-auto p-4 md:p-8 md:py-10 pb-48 md:pb-8 glass-scrollbar">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0  bg-white pb-6">
          <div className="glass-nav border-t border-white/20 shadow-glass z-40 rounded-full w-fit mx-auto">
            <div className="flex gap-1 p-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`
                      flex flex-col items-center justify-center min-w-16 h-14 px-4 rounded-full transition-all duration-300 glass-shine
                      ${isActive 
                        ? 'glass-text-strong bg-gray-900/10' 
                        : 'glass-text hover:text-gray-900/90 hover:bg-gray-900/10'
                      }
                    `}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'glass-icon' : 'glass-icon'}`} />
                    <span className="text-[12px] text-gray-900/90 mt-1">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}