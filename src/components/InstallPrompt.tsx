import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWAがすでにインストールされているかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true)
      return
    }

    // インストールプロンプトイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // アプリがインストールされた時のイベント
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // 24時間後に再表示するためのローカルストレージ設定
    localStorage.setItem('installPromptDismissed', Date.now().toString())
  }

  // 24時間以内に却下されていたら表示しない
  useEffect(() => {
    const dismissedTime = localStorage.getItem('installPromptDismissed')
    if (dismissedTime) {
      const timeDiff = Date.now() - parseInt(dismissedTime)
      const twentyFourHours = 24 * 60 * 60 * 1000
      if (timeDiff < twentyFourHours) {
        setShowPrompt(false)
      }
    }
  }, [])

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 animate-slideUp">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">アプリをインストール</h3>
            <p className="text-sm text-gray-600 mb-4">
              ホーム画面に追加して、いつでも簡単にアクセスできます
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>インストール</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}