import { useState, useEffect, useCallback } from 'react'
import { User, Mail, Calendar, Award, Target, PiggyBank, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase, FixedExpense } from '../lib/supabase'

export function ProfilePage() {
  const { user } = useAuth()
  const { userSettings } = useUserSettings()
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements'>('overview')
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])

  const memberSince = user?.created_at ? new Date(user.created_at) : new Date()
  const daysSinceMember = Math.floor((new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  const fetchFixedExpenses = useCallback(async () => {
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
  }, [user])

  useEffect(() => {
    if (user) {
      fetchFixedExpenses()
    }
  }, [user, fetchFixedExpenses])

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
        <h1 className="text-3xl font-bold glass-text-strong mb-2">プロフィール</h1>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-8 hover:shadow-glass-glow transition-all duration-500 glass-shine">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/30 to-purple-600/30 backdrop-blur-sm border border-blue-400/30 rounded-full flex items-center justify-center shadow-glass-glow">
              <User className="w-12 h-12 glass-icon" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-500/30 to-emerald-600/30 backdrop-blur-sm border-4 border-glass-white rounded-full flex items-center justify-center shadow-glass-glow">
              <Award className="w-4 h-4 glass-icon" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold glass-text-strong mb-2">
              {user?.email?.split('@')[0] || 'ユーザー'}
            </h2>
            <div className="space-y-2 glass-text">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Mail className="w-4 h-4 glass-icon" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Calendar className="w-4 h-4 glass-icon" />
                <span>
                  {format(memberSince, 'yyyy年MM月dd日', { locale: ja })}から利用開始
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold glass-text-strong">{daysSinceMember}</div>
              <div className="text-sm glass-text">利用日数</div>
            </div>
            <div>
              <div className="text-2xl font-bold glass-text-strong">
                {completedAchievements.length}/{totalAchievements}
              </div>
              <div className="text-sm glass-text">達成率</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card hover:shadow-glass-glow transition-all duration-500 glass-shine">
        <div className="border-b border-white/20">
          <nav className="flex space-x-8 px-8">
            {[
              { id: 'overview' as const, name: '概要', icon: User },
              { id: 'achievements' as const, name: '実績', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors glass-shine
                    ${activeTab === tab.id
                      ? 'border-blue-400/50 glass-text-strong'
                      : 'border-transparent glass-text hover:text-white hover:border-white/30'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 glass-icon" />
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
                  <h3 className="text-lg font-semibold glass-text-strong">基本情報</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="glass-text">メールアドレス:</span>
                      <span className="font-medium glass-text-strong">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="glass-text">月収:</span>
                      <span className="font-medium glass-text-strong">
                        ¥{userSettings?.monthly_income?.toLocaleString() || '未設定'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="glass-text">登録日:</span>
                      <span className="font-medium glass-text-strong">
                        {format(memberSince, 'yyyy年MM月dd日', { locale: ja })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold glass-text-strong">収支情報</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="glass-text">月収:</span>
                      <span className="font-medium text-green-400">
                        ¥{userSettings?.monthly_income?.toLocaleString() || '未設定'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="glass-text">固定支出:</span>
                      <span className="font-medium text-red-400">
                        ¥{totalFixedExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="glass-text">月間利用可能額:</span>
                      <span className="font-medium text-blue-400">
                        ¥{monthlyAvailableAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold glass-text-strong">アクティビティ</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="glass-text">利用日数:</span>
                      <span className="font-medium glass-text-strong">{daysSinceMember}日</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="glass-text">達成した実績:</span>
                      <span className="font-medium glass-text-strong">{completedAchievements.length}個</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="glass-text">設定完了:</span>
                      <span className={`font-medium ${userSettings?.setup_completed ? 'text-green-400' : 'text-red-400'}`}>
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
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-sm border border-blue-400/30 text-white px-6 py-3 rounded-full shadow-glass-glow glass-shine">
                  <Award className="w-5 h-5 glass-icon" />
                  <span className="font-medium glass-text-strong">
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
                        p-6 rounded-xl border transition-all duration-200 glass-shine
                        ${achievement.completed
                          ? 'glass-card border-green-400/30 shadow-glass-glow'
                          : 'glass-card border-white/20'
                        }
                      `}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`
                          p-3 rounded-xl backdrop-blur-sm border shadow-glass-glow
                          ${achievement.completed
                            ? 'bg-gradient-to-br from-green-500/30 to-green-600/30 border-green-400/30'
                            : 'bg-glass-white-weak border-white/20'
                          }
                        `}>
                          <Icon className={`w-6 h-6 ${achievement.completed ? 'glass-icon' : 'glass-icon'}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-1 ${achievement.completed ? 'glass-text-strong' : 'glass-text'}`}>
                            {achievement.title}
                          </h4>
                          <p className={`text-sm ${achievement.completed ? 'glass-text' : 'glass-text'}`}>
                            {achievement.description}
                          </p>
                          {achievement.completed && achievement.date && (
                            <p className="text-xs text-green-400 mt-2">
                              {format(new Date(achievement.date), 'yyyy年MM月dd日', { locale: ja })}達成
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}