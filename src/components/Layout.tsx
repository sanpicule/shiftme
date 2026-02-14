import React, { useState } from 'react';
import { Home, Settings, User, TrendingUp, Menu, ChevronLeft } from 'lucide-react';

type Page = 'dashboard' | 'analytics' | 'settings' | 'profile';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const navigation: Array<{
  id: Page;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', name: 'ホーム', icon: Home },
  { id: 'analytics', name: '分析', icon: TrendingUp },
  { id: 'settings', name: '設定', icon: Settings },
  { id: 'profile', name: 'アカウント', icon: User },
];

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePageChange = (page: Page) => {
    if (page !== currentPage) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      onPageChange(page);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar - Desktop */}
      <div
        className={`hidden md:block h-screen transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        {sidebarOpen && (
          <div className=" bg-gray-800 m-4 rounded-2xl shadow-2xl overflow-hidden">
            {/* Sidebar Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center space-x-3">
                <div className="relative group glass-shine">
                  <img src="/shiftme-icon.png" alt="Shiftme" className="w-8 h-8 rounded-lg" />
                </div>
                <h1 className="text-xl text-white font-bold">Shiftme</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close Sidebar"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Sidebar Navigation */}
            <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-112px)] glass-scrollbar">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-bold group relative glass-shine
                      ${
                        isActive
                          ? 'bg-white text-gray-800 border border-white/30 shadow-glass-glow'
                          : 'text-white hover:text-white hover:bg-glass-white-weak'
                      }
                    `}
                  >
                    <div>
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-gray-800' : 'text-white group-hover:text-white/90'}`}
                      />
                    </div>
                    <span className="text-shadow">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Desktop Header with Menu Button (only when sidebar is closed) */}
        {!sidebarOpen && (
          <header className="hidden md:flex items-center p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors glass-shine border border-white/20"
              aria-label="Open Sidebar"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </header>
        )}

        {/* Mobile Header */}
        <header className="md:hidden">
          <div className="flex items-center p-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl text-slate-800 font-bold tracking-wide">Shiftme</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 md:py-10 pb-48 md:pb-8 glass-scrollbar">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-6 left-6 right-4 glass-nav shadow-glass z-40 rounded-full w-fit ml-auto">
          <div className="flex gap-1 p-1 relative">
            {/* Sliding Active Indicator */}
            <div
              className={`absolute top-1 bg-gray-900/10 border border-white rounded-full h-14 transition-all duration-500 ${
                isAnimating ? 'scale-110' : 'scale-100'
              }`}
              style={{
                left: `${2 + navigation.findIndex(item => item.id === currentPage) * 68}px`,
                width: '68px',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />

            {navigation.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`
                    flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all duration-300 glass-shine relative z-10
                    ${
                      isActive
                        ? 'glass-text-strong'
                        : 'glass-text hover:text-gray-900/90 hover:bg-gray-900/5'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'glass-icon' : 'glass-icon'}`} />
                  <span className="text-[10px] text-gray-900/90">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
