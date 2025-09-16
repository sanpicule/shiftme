import { useState } from 'react'
import { LogOut, AlertTriangle, X } from 'lucide-react'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-modal max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-400 to-red-600 rounded-lg shadow-glass-glow">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold glass-text-strong">ログアウト確認</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 glass-icon hover:text-white hover:bg-glass-white-weak rounded-lg transition-all duration-300 glass-shine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-glass-glow">
              <LogOut className="w-8 h-8 text-white" />
            </div>
            <p className="glass-text text-base leading-relaxed">
              本当にログアウトしますか？<br />
              ログアウトすると、再度ログインが必要になります。
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="glass-button-strong flex-1 px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-400 rounded-xl hover:bg-red-500/30 hover:border-red-400/50 transition-all duration-300 font-semibold glass-shine flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>ログアウト</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
