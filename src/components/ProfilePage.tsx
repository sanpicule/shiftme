import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Award, TrendingUp, Target, PiggyBank } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase, FixedExpense } from '../lib/supabase'

export function ProfilePage() {
  const { user } = useAuth()
  const { userSettings } = useUserSettings()
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'statistics'>('overview')
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])

  const memberSince = user?.created_at ? new Date(user.created_at) : new Date()
  const daysSinceMember = Math.floor((new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  useEffect(() => {
    if (user) {
      fetchFixedExpenses()
    }
  }, [user])

  const fetchFixedExpenses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setFixedExpenses(data || [])
    } catch (error) {
      console.error('Error fetching fixed expenses:', error)
      setFixedExpenses([])
    }
  }

  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyAvailableAmount = (userSettings?.monthly_income || 0) - totalFixedExpenses

  const achievements = [
    {
      id: 1,
      title: '初回設定完了',
      description: 'プロフィールと初期設定を完了しました',
      icon: User, // Changed from Settings to User
      completed: userSettings?.setup_completed || false,
      date: userSettings?.created_at,
    },
    {
      id: 2,
      title: '貯金マスター',
      description: '目標を設定して貯金を開始しました',
      icon: Target,
      completed: true,
      date: userSettings?.created_at,
    },
    {
      id: 3,
      title: '継続は力なり',
      description: '7日間連続でアプリを利用しました',
      icon: TrendingUp,
      completed: daysSinceMember >= 7,
      date: new Date().toISOString(),
    },
    {
      id: 4,
      title: '貯金の達人',
      description: '月間予算を守って生活しています',
      icon: PiggyBank,
      completed: false,
      date: null,
    },
  ]

  const completedAchievements = achievements.filter(a => a.completed)
  const totalAchievements = achievements.length

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">プロフィール</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white">
              <Award className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.email?.split('@')[0] || 'ユーザー'}
            </h2>
            <div className="space-y-2 text-gray-600">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(memberSince, 'yyyy年MM月dd日', { locale: ja })}から利用開始
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{daysSinceMember}</div>
              <div className="text-sm text-gray-600">利用日数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {completedAchievements.length}/{totalAchievements}
              </div>
              <div className="text-sm text-gray-600">達成率</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="border-b border-gray-200/50">
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview' as const, name: '概要', icon: User },
              { id: 'achievements' as const, name: '実績', icon: Award },
              { id: 'statistics' as const, name: '統計', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">メールアドレス:</span>
                      <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">月収:</span>
                      <span className="font-medium">
                        ¥{userSettings?.monthly_income?.toLocaleString() || '未設定'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">登録日:</span>
                      <span className="font-medium">
                        {format(memberSince, 'yyyy年MM月dd日', { locale: ja })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">収支情報</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">月収:</span>
                      <span className="font-medium text-green-600">
                        ¥{userSettings?.monthly_income?.toLocaleString() || '未設定'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">固定支出:</span>
                      <span className="font-medium text-red-600">
                        ¥{totalFixedExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">月間利用可能額:</span>
                      <span className="font-medium text-blue-600">
                        ¥{monthlyAvailableAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">アクティビティ</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">利用日数:</span>
                      <span className="font-medium">{daysSinceMember}日</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">達成した実績:</span>
                      <span className="font-medium">{completedAchievements.length}個</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">設定完了:</span>
                      <span className={`font-medium ${userSettings?.setup_completed ? 'text-green-600' : 'text-red-600'}`}>
                        {userSettings?.setup_completed ? '完了' : '未完了'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">
                    {completedAchievements.length}/{totalAchievements} 実績達成
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div
                      key={achievement.id}
                      className={`
                        p-6 rounded-xl border transition-all duration-200
                        ${achievement.completed
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg'
                          : 'bg-gray-50/50 border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`
                          p-3 rounded-xl
                          ${achievement.completed
                            ? 'bg-gradient-to-br from-green-400 to-green-600'
                            : 'bg-gray-300'
                          }
                        `}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-1 ${achievement.completed ? 'text-green-800' : 'text-gray-600'}`}>
                            {achievement.title}
                          </h4>
                          <p className={`text-sm ${achievement.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            {achievement.description}
                          </p>
                          {achievement.completed && achievement.date && (
                            <p className="text-xs text-green-500 mt-2">
                              {format(new Date(achievement.date), 'yyyy年MM月dd日', { locale: ja })}達成
                            </p>
                          )}
                                </div>
      </div>

      {/* Logout Confirm Modal */}
      {/* 削除済み */}
    </div>
  )
})}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-800">利用統計</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-600">総利用日数:</span>
                      <span className="font-bold text-blue-800">{daysSinceMember}日</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">平均利用頻度:</span>
                      <span className="font-bold text-blue-800">毎日</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-green-800">収支統計</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-600">月収:</span>
                      <span className="font-bold text-green-800">¥{userSettings?.monthly_income?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">固定支出:</span>
                      <span className="font-bold text-green-800">¥{totalFixedExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-purple-800">実績統計</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-600">達成実績:</span>
                      <span className="font-bold text-purple-800">{completedAchievements.length}個</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">達成率:</span>
                      <span className="font-bold text-purple-800">
                        {Math.round((completedAchievements.length / totalAchievements) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Expenses Details */}
              {fixedExpenses && fixedExpenses.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-orange-800">固定支出詳細</h3>
                  </div>
                  <div className="space-y-3">
                    {fixedExpenses.map((expense, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white/50 rounded-lg">
                        <span className="text-orange-700 font-medium">{expense.name}</span>
                        <span className="text-orange-800 font-bold">¥{expense.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-3 bg-orange-200/50 rounded-lg border-t border-orange-300">
                      <span className="text-orange-800 font-semibold">合計</span>
                      <span className="text-orange-800 font-bold text-lg">
                        ¥{totalFixedExpenses.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings and Logout Buttons */}
      {/* 削除済み */}

      {/* Logout Confirm Modal */}
      {/* 削除済み */}
    </div>
  )
}