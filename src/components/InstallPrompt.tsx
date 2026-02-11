import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Star, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS検出
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // PWAがすでにインストールされているかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // インストールプロンプトイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // 24時間以内に却下されていたら表示しない
      const dismissedTime = localStorage.getItem('installPromptDismissed');
      if (dismissedTime) {
        const timeDiff = Date.now() - parseInt(dismissedTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (timeDiff < twentyFourHours) {
          return;
        }
      }

      // 少し遅延してプロンプトを表示
      setTimeout(() => setShowPrompt(true), 3000);
    };

    // アプリがインストールされた時のイベント
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('installPromptDismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
        localStorage.removeItem('installPromptDismissed');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 24時間後に再表示するためのローカルストレージ設定
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  const handleIOSInstall = () => {
    setShowPrompt(false);
    // iOSの場合は手動インストール手順を表示
    alert(
      'このアプリをホーム画面に追加するには:\n1. Safariの共有ボタン（□↑）をタップ\n2. 「ホーム画面に追加」を選択\n3. 「追加」をタップ',
    );
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slideUp">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-xl"></div>

        <div className="relative z-10">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">
                {isIOS ? 'ホーム画面に追加' : 'アプリをインストール'}
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {isIOS
                  ? 'Safariの共有ボタンから「ホーム画面に追加」でアプリのように使えます'
                  : 'ホーム画面に追加して、いつでも簡単にアクセスできます'}
              </p>

              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Zap className="w-3 h-3" />
                  <span>高速起動</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Star className="w-3 h-3" />
                  <span>オフライン対応</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={isIOS ? handleIOSInstall : handleInstallClick}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{isIOS ? '手順を見る' : 'インストール'}</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-xl hover:bg-gray-100/50 transition-colors"
                  title="後で"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
