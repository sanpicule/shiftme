import React, { useState } from 'react'
import { PiggyBank, Mail, Lock, Eye, EyeOff, Sparkles, Star, Zap } from 'lucide-react'
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
    } catch (error) {
      setMessage('エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo Section - Compact */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/25 group-hover:shadow-3xl group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                <PiggyBank className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Star className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Shiftme
          </h1>
          <p className="text-lg text-gray-700 font-semibold mb-1">夢を叶える貯金アプリ</p>
          <p className="text-sm text-gray-500">あなたの目標達成をサポートします</p>
        </div>

        {/* Auth Form - Compact */}
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

        {/* Features - Compact */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/30 text-center hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-700 font-semibold">簡単貯金管理</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/30 text-center hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-700 font-semibold">目標達成支援</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/30 text-center hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs text-gray-700 font-semibold">安全なデータ</p>
          </div>
        </div>
      </div>
    </div>
  )
}