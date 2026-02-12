import React, { useState } from 'react';
import { Eye, EyeOff, Target, Shield, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);

      if (error) {
        setMessage(error.message);
      } else if (!isLogin) {
        setMessage('登録完了しました。ログインしてください。');
        setIsLogin(true);
      }
    } catch (error: unknown) {
      setMessage(
        error instanceof Error && error.message ? error.message : `エラーが発生しました。`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row lg:justify-center lg:max-w-7xl lg:mx-auto">
        {/* Left Side - Features & Description (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 lg:py-12">
          {/* Logo Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="relative group glass-shine">
                <img
                  src="/public/shiftme-icon.png"
                  alt="Shiftme"
                  className="w-20 h-20 rounded-xl"
                />
              </div>
              <h1 className="ml-6 text-5xl font-black glass-text-strong">Shiftme</h1>
            </div>
            <h3 className="text-2xl font-bold glass-text-strong mb-4">夢を叶える貯金アプリ</h3>
            <p className="text-md glass-text leading-relaxed">
              あなたの目標達成をサポートし、効率的な貯金管理を実現します。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card p-6 hover:bg-glass-white-strong transition-all duration-300 hover:scale-105 glass-shine">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500/30 to-gray-600/30 backdrop-blur-sm border border-gray-400/30 rounded-2xl flex items-center justify-center shadow-glass-glow">
                  <Target className="w-6 h-6 glass-icon" />
                </div>
                <h3 className="text-lg font-bold glass-text-strong ml-4">目標設定</h3>
              </div>
              <p className="glass-text text-sm">具体的な目標を設定し、達成までの道筋を可視化</p>
            </div>

            <div className="glass-card p-6 hover:bg-glass-white-strong transition-all duration-300 hover:scale-105 glass-shine">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-sm border border-gray-500/30 rounded-2xl flex items-center justify-center shadow-glass-glow">
                  <TrendingUp className="w-6 h-6 glass-icon" />
                </div>
                <h3 className="text-lg font-bold glass-text-strong ml-4">進捗管理</h3>
              </div>
              <p className="glass-text text-sm">貯金の進捗をグラフで確認し、モチベーションを維持</p>
            </div>

            <div className="glass-card p-6 hover:bg-glass-white-strong transition-all duration-300 hover:scale-105 glass-shine">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700/30 to-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-2xl flex items-center justify-center shadow-glass-glow">
                  <Calendar className="w-6 h-6 glass-icon" />
                </div>
                <h3 className="text-lg font-bold glass-text-strong ml-4">支出管理</h3>
              </div>
              <p className="glass-text text-sm">日々の支出を記録し、無駄な出費を削減</p>
            </div>

            <div className="glass-card p-6 hover:bg-glass-white-strong transition-all duration-300 hover:scale-105 glass-shine">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl flex items-center justify-center shadow-glass-glow">
                  <Shield className="w-6 h-6 glass-icon" />
                </div>
                <h3 className="text-lg font-bold glass-text-strong ml-4">セキュリティ</h3>
              </div>
              <p className="glass-text text-sm">銀行レベルのセキュリティで大切なデータを保護</p>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="mt-12 text-center">
            <p className="glass-text text-lg">今すぐ始めて、夢への第一歩を踏み出しましょう</p>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="px-12 flex-1 flex items-center justify-center py-8 lg:px-12 lg:py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo Section (shown only on mobile) */}
            <div className="lg:hidden">
              <div className="flex items-center mb-6">
                <div className="relative group glass-shine">
                  <img src="/shiftme-icon.png" alt="Shiftme" className="w-16 h-16 rounded-lg" />
                </div>
                <h1 className="ml-4 text-3xl font-black glass-text-strong">
                  <p className="text-xs font-thin">夢を叶える貯金アプリ</p>
                  Shiftme
                </h1>
              </div>
            </div>

            {/* Auth Form */}
            <div className="glass-shine mt-20">
              <div className="mb-6">
                <h2 className="text-xl font-bold glass-text-strong mb-1">
                  {isLogin ? 'ログイン' : '新規登録'}
                </h2>
                <p className="text-sm glass-text">
                  {isLogin
                    ? 'アカウントにログインしてください'
                    : '新しいアカウントを作成しましょう'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold glass-text-strong mb-1">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="glass-input w-full pr-4 py-3"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold glass-text-strong mb-1"
                  >
                    パスワード
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="glass-input w-full py-3"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!password}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 glass-icon p-1 ${password ? '' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      {!showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div
                    className={`text-sm p-4 rounded-2xl backdrop-blur-sm border ${
                      message.includes('エラー') || message.includes('error')
                        ? 'bg-red-500/20 text-red-300 border-red-400/30'
                        : 'bg-green-500/20 text-green-300 border-green-400/30'
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-base bg-white/90 backdrop-blur-md rounded-2xl text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed glass-shine relative overflow-hidden"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
                      <span>処理中...</span>
                    </div>
                  ) : (
                    <div className="space-x-2 z-10 bg-gray-800 text-white p-3 rounded-2xl">
                      <span>{isLogin ? 'ログイン' : '新規登録'}</span>
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-gray-400 hover:text-gray-300 font-semibold transition-colors hover:underline text-sm"
                >
                  {isLogin
                    ? 'アカウントをお持ちでない方はこちら'
                    : 'すでにアカウントをお持ちの方はこちら'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
