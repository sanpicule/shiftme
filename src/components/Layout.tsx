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
      <div className="hidden md:block w-64 h-screen glass-nav border-r border-white/20 shadow-glass">
        {/* Sidebar Header */}
        <div className="flex items-center p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
                <div className="relative group glass-shine">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glass-glow group-hover:shadow-glass-glow group-hover:scale-105 transition-all duration-300">
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white">
          <div className="flex items-center px-4 py-3">
            <div className="flex items-center space-x-1">
              <div className="relative group glass-shine">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img src="/shiftme-icon.png" alt="Shiftme" className="w-8 h-8 rounded-md" />
                </div>
              </div>
              <h1 className="text-lg text-black/70 font-black">
                Shiftme
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="h-full overflow-y-auto p-6 md:p-8 md:py-10 pb-48 md:pb-8 glass-scrollbar">
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