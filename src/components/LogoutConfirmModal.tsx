import { useState } from 'react'

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
    <div className="fixed inset-0 bg-gray-800/40 flex items-center justify-center p-4 z-50">
      <div className="glass-modal w-fit border border-gray-500">
        <div className="text-center pt-6">
          <p className="px-6 text-white text-base leading-relaxed">
            本当にログアウトしますか？
          </p>

          <div className="flex flex-col md:flex-row pt-4">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3 font-semibold glass-shine flex items-center justify-center space-x-2 border-b border-t border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              ) : (
                <span className='text-red-400'>ログアウト</span>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
