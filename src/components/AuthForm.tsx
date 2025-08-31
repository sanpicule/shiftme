import React, { useState } from 'react'
import { PiggyBank, Mail, Lock, Eye, EyeOff, Sparkles, Star, Zap, Target, Shield, TrendingUp, Calendar } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 via-indigo-100 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/30 via-purple-500/25 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 via-pink-500/25 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/20 via-indigo-400/15 to-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-pink-300/15 to-orange-300/15 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-32 w-28 h-28 bg-gradient-to-br from-green-300/10 to-blue-300/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '5s' }}></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row lg:justify-center lg:max-w-7xl lg:mx-auto">
        {/* Left Side - Features & Description (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 lg:py-12">
          {/* Logo Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:shadow-3xl group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <PiggyBank className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="ml-6 text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Shiftme
              </h1>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">夢を叶える貯金アプリ</h3>
            <p className="text-md text-gray-600 leading-relaxed">あなたの目標達成をサポートし、効率的な貯金管理を実現します。</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 ml-4">目標設定</h3>
              </div>
              <p className="text-gray-600 text-sm">具体的な目標を設定し、達成までの道筋を可視化</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 ml-4">進捗管理</h3>
              </div>
              <p className="text-gray-600 text-sm">貯金の進捗をグラフで確認し、モチベーションを維持</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 ml-4">支出管理</h3>
              </div>
              <p className="text-gray-600 text-sm">日々の支出を記録し、無駄な出費を削減</p>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 ml-4">セキュリティ</h3>
              </div>
              <p className="text-gray-600 text-sm">銀行レベルのセキュリティで大切なデータを保護</p>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-lg">今すぐ始めて、夢への第一歩を踏み出しましょう</p>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-12 lg:py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo Section (shown only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="relative group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:shadow-3xl group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <PiggyBank className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                    <Sparkles className="w-2 h-2 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                    <Star className="w-1.5 h-1.5 text-white" />
                  </div>
                </div>
                <h1 className="ml-4 text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Shiftme
                </h1>
              </div>
              <p className="text-lg text-gray-700 font-semibold">夢を叶える貯金アプリ</p>
            </div>

            {/* Auth Form */}
            <div className="bg-white/60 backdrop-blur-xl py-8 px-8 shadow-2xl rounded-3xl border border-white/30 hover:shadow-3xl transition-all duration-500">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {isLogin ? 'ログイン' : '新規登録'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isLogin ? 'アカウントにログインしてください' : '新しいアカウントを作成しましょう'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base shadow-lg"
                      placeholder="example@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                    パスワード
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-base shadow-lg"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className={`text-sm p-4 rounded-2xl backdrop-blur-sm border ${
                    message.includes('エラー') || message.includes('error')
                      ? 'bg-red-50/80 text-red-700 border-red-200/50'
                      : 'bg-green-50/80 text-green-700 border-green-200/50'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold text-base shadow-2xl shadow-blue-500/25 hover:shadow-3xl hover:shadow-blue-500/40 transform hover:-translate-y-1 hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>処理中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>{isLogin ? 'ログイン' : '新規登録'}</span>
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline text-sm"
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