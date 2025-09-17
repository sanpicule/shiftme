import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Zap, Target, Shield, TrendingUp, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setMessage(error.message)
      } else if (!isLogin) {
        setMessage('登録完了しました。ログインしてください。')
        setIsLogin(true)
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error && error.message ? error.message : `エラーが発生しました。`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-500/20 via-gray-400/15 to-gray-600/10 rounded-full blur-3xl glass-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-gray-600/20 via-gray-500/15 to-gray-700/10 rounded-full blur-3xl glass-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-400/10 via-gray-500/8 to-gray-600/10 rounded-full blur-3xl glass-float" style={{ animationDelay: '4s' }}></div>

          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-gray-400/15 to-gray-500/10 rounded-full blur-2xl glass-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-gray-500/20 to-gray-600/15 rounded-full blur-2xl glass-float" style={{ animationDelay: '3s' }}></div>
          <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-br from-gray-600/15 to-gray-700/10 rounded-full blur-2xl glass-float" style={{ animationDelay: '5s' }}></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row lg:justify-center lg:max-w-7xl lg:mx-auto">
        {/* Left Side - Features & Description (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 lg:py-12">
          {/* Logo Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
                <div className="relative group glass-shine">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-500/30 via-gray-600/30 to-gray-700/30 backdrop-blur-sm border border-gray-400/30 rounded-3xl flex items-center justify-center shadow-glass-glow group-hover:shadow-glass-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <img src="/shiftme-icon.png" alt="Shiftme" className="w-18 h-18 rounded-xl" />
                  </div>
                </div>
              <h1 className="ml-6 text-5xl font-black glass-text-strong">
                Shiftme
              </h1>
            </div>
            <h3 className="text-2xl font-bold glass-text-strong mb-4">夢を叶える貯金アプリ</h3>
            <p className="text-md glass-text leading-relaxed">あなたの目標達成をサポートし、効率的な貯金管理を実現します。</p>
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
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-12 lg:py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo Section (shown only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative group glass-shine">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500/30 via-gray-600/30 to-gray-700/30 backdrop-blur-sm border border-gray-400/30 rounded-xl flex items-center justify-center shadow-glass-glow group-hover:shadow-glass-glow transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <img src="/shiftme-icon.png" alt="Shiftme" className="w-12 h-12 rounded-lg" />
                  </div>
                </div>
                <h1 className="ml-4 text-3xl font-black glass-text-strong">
                  Shiftme
                </h1>
              </div>
              <p className="text-lg glass-text-strong font-semibold">夢を叶える貯金アプリ</p>
            </div>

            {/* Auth Form */}
            <div className="glass-modal py-8 px-8 hover:shadow-glass-glow transition-all duration-500 glass-shine">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold glass-text-strong mb-1">
                  {isLogin ? 'ログイン' : '新規登録'}
                </h2>
                <p className="text-sm glass-text">
                  {isLogin ? 'アカウントにログインしてください' : '新しいアカウントを作成しましょう'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold glass-text-strong mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 glass-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input w-full pl-12 pr-4 py-3"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold glass-text-strong mb-2">
                    パスワード
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 glass-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input w-full pl-12 pr-12 py-3"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 glass-icon hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`text-sm p-4 rounded-2xl backdrop-blur-sm border ${
                    message.includes('エラー') || message.includes('error')
                      ? 'bg-red-500/20 text-red-300 border-red-400/30'
                      : 'bg-green-500/20 text-green-300 border-green-400/30'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-6 font-bold text-base bg-white/90 backdrop-blur-md border-2 border-white/50 rounded-2xl text-gray-900 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-white/30 disabled:opacity-50 disabled:cursor-not-allowed glass-shine relative overflow-hidden"
                >
                  {/* 背景のアニメーション効果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent"></div>
                      <span>処理中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 relative z-10">
                      <Zap className="w-4 h-4" />
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
                  {isLogin ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}