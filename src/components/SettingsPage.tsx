import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { useUserSettings } from '../hooks/useUserSettings'
import { useToast } from './ToastContainer'
import { supabase, FixedExpense, SavingsGoal } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SkeletonCard, SkeletonText } from './SkeletonCard'
import { useData } from '../contexts/DataContext'

interface IncomeForm {
  monthly_income: number
  bonus_amount: number
  bonus_months: string
}

interface FixedExpenseForm {
  name: string
  amount: number
  category: string
}

interface SavingsGoalForm {
  title: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  start_date?: string
}

export function SettingsPage() {
  const { user } = useAuth()
  const { userSettings, updateUserSettings } = useUserSettings()
  const { showSuccess, showError } = useToast()
  const { fixedExpenses, savingsGoals, loading: dataLoading, refetchData } = useData()
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [showDeleteGoalConfirmModal, setShowDeleteGoalConfirmModal] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)
  const [editingIncome, setEditingIncome] = useState(false)

  const { register: registerIncome, handleSubmit: handleIncomeSubmit, setValue: setIncomeValue } = useForm<IncomeForm>()
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense } = useForm<FixedExpenseForm>()
  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal } = useForm<SavingsGoalForm>()

  // 編集用のフォーム状態（一時的な値を保持）
  const [tempExpense, setTempExpense] = useState<FixedExpenseForm>({
    name: '',
    amount: 0,
    category: '住居費'
  })
  const [tempGoal, setTempGoal] = useState<SavingsGoalForm>({
    title: '',
    description: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    start_date: ''
  })

  useEffect(() => {
    if (userSettings) {
      setIncomeValue('monthly_income', userSettings.monthly_income)
      setIncomeValue('bonus_amount', userSettings.bonus_amount || 0)
      setIncomeValue('bonus_months', userSettings.bonus_months || '')
    }
  }, [userSettings, setIncomeValue])

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <SkeletonText className="h-8" width="w-40" />
          <SkeletonText className="h-4" width="w-56" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard>
            <div className="p-6 space-y-4">
              <SkeletonText className="h-6" width="w-32" />
              <div className="space-y-2">
                <SkeletonText width="w-3/4" />
                <SkeletonText width="w-2/3" />
                <SkeletonText width="w-1/2" />
              </div>
              <div className="h-12 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <div className="p-6 space-y-4">
              <SkeletonText className="h-6" width="w-32" />
              <div className="space-y-2">
                <div className="h-10 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                <div className="h-10 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                <div className="h-10 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
              </div>
            </div>
          </SkeletonCard>
        </div>
        <SkeletonCard>
          <div className="p-6 space-y-4">
            <SkeletonText className="h-6" width="w-36" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-setting-row-${index}`}
                  className="h-12 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </SkeletonCard>
      </div>
    )
  }

  const handleIncomeUpdate = async (data: IncomeForm) => {
    setLoading(true)
    try {
      await updateUserSettings({
        monthly_income: data.monthly_income,
        bonus_amount: data.bonus_amount,
        bonus_months: data.bonus_months
      })
      showSuccess('収入設定を更新しました', `月収: ¥${data.monthly_income.toLocaleString()}`)
      setEditingIncome(false)
    } catch (error) {
      console.error('Error updating income:', error)
      showError('更新に失敗しました', 'もう一度お試しください')
    } finally {
      setLoading(false)
    }
  }

  const addFixedExpense = async (data: FixedExpenseForm) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .insert({ ...data, user_id: user.id })

      if (error) throw error

      resetExpense()
      refetchData()
      showSuccess('固定支出を追加しました', `${data.name}: ¥${data.amount.toLocaleString()}`)
      setShowExpenseForm(false)
    } catch (error) {
      console.error('Error adding fixed expense:', error)
      showError('追加に失敗しました', 'もう一度お試しください')
    }
  }

  const deleteFixedExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      refetchData()
      showSuccess('固定支出を削除しました')
    } catch (error) {
      console.error('Error deleting fixed expense:', error)
      showError('削除に失敗しました', 'もう一度お試しください')
    }
  }

  const addSavingsGoal = async (data: SavingsGoalForm) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('savings_goals')
        .insert({ ...data, user_id: user.id })

      if (error) throw error

      resetGoal()
      refetchData()
      showSuccess('貯金目標を追加しました', `${data.title}: ¥${data.target_amount.toLocaleString()}`)
      setShowGoalForm(false)
    } catch (error) {
      console.error('Error adding savings goal:', error)
      showError('追加に失敗しました', 'もう一度お試しください')
    }
  }

  const deleteSavingsGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      refetchData()
      showSuccess('貯金目標を削除しました')
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      showError('削除に失敗しました', 'もう一度お試しください')
    }
  }

  const startEditExpense = (expense: FixedExpense) => {
    setEditingExpense(expense.id)
    setTempExpense({
      name: expense.name,
      amount: expense.amount,
      category: expense.category
    })
  }

  const updateFixedExpense = async () => {
    if (!editingExpense || !user) return

    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .update(tempExpense)
        .eq('id', editingExpense)
        .eq('user_id', user.id)

      if (error) throw error

      setEditingExpense(null)
      refetchData()
      showSuccess('固定支出を更新しました', `${tempExpense.name}: ¥${tempExpense.amount.toLocaleString()}`)
    } catch (error) {
      console.error('Error updating fixed expense:', error)
      showError('更新に失敗しました', 'もう一度お試しください')
    }
  }

  const startEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal.id)
    setTempGoal({
      title: goal.title,
      description: goal.description,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount || 0,
      target_date: goal.target_date,
      start_date: goal.start_date || ''
    })
  }

  const updateSavingsGoal = async () => {
    if (!editingGoal || !user) return

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update(tempGoal)
        .eq('id', editingGoal)
        .eq('user_id', user.id)

      if (error) throw error

      setEditingGoal(null)
      refetchData()
      showSuccess('貯金目標を更新しました', `${tempGoal.title}: ¥${tempGoal.target_amount.toLocaleString()}`)
    } catch (error) {
      console.error('Error updating savings goal:', error)
      showError('更新に失敗しました', 'もう一度お試しください')
    }
  }

  const categories = [
    '住居費',
    '光熱費',
    '通信費',
    '保険',
    '交通費',
    'その他',
  ]

  const calculateMonthlySavings = (goal: SavingsGoal | SavingsGoalForm) => {
    const targetDate = new Date(goal.target_date)
    const remainingMonths = Math.max(1, Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)))
    const remainingAmount = goal.target_amount - (goal.current_amount || 0)
    return Math.ceil(remainingAmount / remainingMonths)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold mb-3 text-gray-800">
          設定
        </h1>
        <p className="text-sm text-gray-800">収入、固定支出、貯金目標を設定しましょう</p>
      </div>

      {/* Income Section */}
      <div className="border border-gray-300 rounded-xl p-4 glass-shine">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">収入設定</h2>
            <p className="text-sm text-gray-800">毎月の収入とボーナスを設定してください</p>
          </div>
          {!editingIncome && (
            <button
              onClick={() => setEditingIncome(true)}
              className="glass-text hover:bg-glass-white-weak rounded-xl transition-colors border border-white/10"
            >
              <Edit2 className="w-5 h-5 glass-icon" />
            </button>
          )}
        </div>

        {editingIncome ? (
          <form onSubmit={handleIncomeSubmit(handleIncomeUpdate)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  月収（円）
                </label>
                <input
                  type="number"
                  {...registerIncome('monthly_income', { required: true, min: 0 })}
                  className="glass-input w-full px-6 py-4 text-lg font-medium text-gray-800"
                  placeholder="300000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  ボーナス額（円）
                </label>
                <input
                  type="number"
                  {...registerIncome('bonus_amount', { min: 0 })}
                  className="glass-input w-full px-6 py-4 text-lg font-medium text-gray-800"
                  placeholder="500000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                ボーナス支給月（カンマ区切り、例：3,9）
              </label>
              <input
                type="text"
                {...registerIncome('bonus_months')}
                className="glass-input w-full px-6 py-4 text-lg font-medium text-gray-800"
                placeholder="3,9"
              />
              <p className="text-xs text-gray-600 mt-2">3月と9月にボーナスを支給する場合は「3,9」と入力</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingIncome(false)}
                className="px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-gray-800 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-semibold"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-6 py-4 bg-gray-800 backdrop-blur-sm text-white rounded-xl hover:bg-white/15 hover:border-white/40 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? '更新中...' : '更新'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-800 font-medium">月収</span>
              <span className="text-2xl font-semibold text-gray-800">
                ¥{userSettings?.monthly_income?.toLocaleString() || '0'}
              </span>
            </div>
            {(userSettings?.bonus_amount || 0) > 0 && (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-800 font-medium">ボーナス額</span>
                  <span className="text-2xl font-semibold text-gray-800">
                    ¥{userSettings?.bonus_amount?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-800 font-medium">支給月</span>
                  <span className="text-lg font-semibold text-gray-800">
                    {userSettings?.bonus_months || '未設定'}月
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Fixed Expenses Section */}
      <div className="border border-gray-300 rounded-xl p-4 glass-shine">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">固定支出管理</h2>
            <p className="text-sm text-gray-800">毎月の固定支出を管理してください</p>
          </div>
        </div>

        {/* 統一された追加フォーム表示 */}
        <div className="mb-6">
          {!showExpenseForm ? (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-gray-300 text-gray-800 rounded-xl font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>固定支出を追加</span>
            </button>
          ) : (
            <form onSubmit={handleExpenseSubmit(addFixedExpense)} className="space-y-4 p-4 glass-card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">項目名</label>
                  <input
                    type="text"
                    {...registerExpense('name', { required: true })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="家賃"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">金額（円）</label>
                  <input
                    type="number"
                    {...registerExpense('amount', { required: true, min: 0 })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">カテゴリ</label>
                  <select
                    {...registerExpense('category')}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 backdrop-blur-sm text-white rounded-xl font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>追加</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 text-gray-800 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-semibold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Fixed Expenses List */}
        <div className="space-y-4">
          {fixedExpenses.map((expense) => (
            <div key={expense.id} className="p-6 glass-card glass-shine">
              {editingExpense === expense.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">項目名</label>
                    <input
                      type="text"
                      value={tempExpense.name}
                      className="glass-input w-full px-3 py-2 text-gray-800"
                      onChange={(e) => setTempExpense(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">カテゴリ</label>
                    <select
                      value={tempExpense.category}
                      className="glass-input w-full px-3 py-2 text-gray-800"
                      onChange={(e) => setTempExpense(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">金額（円）</label>
                    <input
                      type="number"
                      value={tempExpense.amount}
                      className="glass-input w-full px-3 py-2 text-gray-800"
                      onChange={(e) => setTempExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={updateFixedExpense}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 backdrop-blur-sm text-white rounded-xl font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      <span>更新</span>
                    </button>
                    <button
                      onClick={() => setEditingExpense(null)}
                      className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 text-gray-800 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-semibold"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <div>
                        <p className="text-sm text-gray-800 font-medium">カテゴリ：{expense.category}</p>
                        <h4 className="font-medium text-gray-800 text-base">{expense.name}</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <span className="text-xl font-semibold text-gray-800">
                        ¥{expense.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => startEditExpense(expense)}
                      className="glass-text hover:bg-glass-white-weak rounded-xl transition-colors border border-white/10"
                    >
                      <Edit2 className="w-5 h-5 glass-icon" />
                    </button>
                    <button
                      onClick={() => {
                        setExpenseToDelete(expense.id)
                        setShowDeleteConfirmModal(true)
                      }}
                      className="text-red-400 rounded-xl transition-all duration-300 glass-shine"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {fixedExpenses.length > 0 && (
          <div className="mt-8 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-md text-gray-800">固定支出合計</span>
              <span className="text-2xl font-semibold text-gray-800">
                ¥{fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Savings Goals Section */}
      <div className="border border-gray-300 rounded-xl p-4 glass-shine">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">貯金目標管理</h2>
            <p className="text-sm text-gray-800">貯金の目標を設定して管理しましょう</p>
          </div>
        </div>

        {/* 統一された追加フォーム表示 */}
        <div className="mb-6">
          {!showGoalForm ? (
            <button
              onClick={() => setShowGoalForm(true)}
              className="w-full md:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-gray-300 text-gray-800 rounded-xl font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>貯金目標を追加</span>
            </button>
          ) : (
            <form onSubmit={handleGoalSubmit(addSavingsGoal)} className="space-y-4 p-4 glass-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">目標タイトル</label>
                  <input
                    type="text"
                    {...registerGoal('title', { required: true })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="海外旅行の資金"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">目標金額（円）</label>
                  <input
                    type="number"
                    {...registerGoal('target_amount', { required: true, min: 0 })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">現在の貯金額（円）</label>
                  <input
                    type="number"
                    {...registerGoal('current_amount', { min: 0 })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">達成予定日</label>
                  <input
                    type="date"
                    {...registerGoal('target_date', { required: true })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">目標開始日</label>
                  <input
                    type="date"
                    {...registerGoal('start_date')}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">詳細・説明</label>
                <textarea
                  {...registerGoal('description')}
                  rows={3}
                  className="glass-input w-full px-4 py-3 text-gray-800"
                  placeholder="ヨーロッパ周遊旅行のために貯金したい"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 backdrop-blur-sm  text-white rounded-xl font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>追加</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 text-gray-800 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 font-semibold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Savings Goals List */}
        <div className="space-y-6">
          {savingsGoals.map((goal) => (
            <div key={goal.id} className="p-4 glass-card transition-all duration-300 glass-shine">
              {editingGoal === goal.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">目標タイトル</label>
                    <input
                      type="text"
                      value={tempGoal.title}
                      className="glass-input w-full px-4 py-2 text-gray-800"
                      onChange={(e) => setTempGoal(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">詳細・説明</label>
                    <textarea
                      value={tempGoal.description}
                      rows={2}
                      className="glass-input w-full px-4 py-2 text-gray-800"
                      onChange={(e) => setTempGoal(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">目標金額（円）</label>
                      <input
                        type="number"
                        value={tempGoal.target_amount}
                        className="glass-input w-full px-3 py-2 text-gray-800"
                        onChange={(e) => setTempGoal(prev => ({ ...prev, target_amount: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">現在の貯金額（円）</label>
                      <input
                        type="number"
                        value={tempGoal.current_amount}
                        className="glass-input w-full px-3 py-2 text-gray-800"
                        onChange={(e) => setTempGoal(prev => ({ ...prev, current_amount: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">達成予定日</label>
                      <input
                        type="date"
                        value={tempGoal.target_date}
                        className="glass-input w-full px-3 py-2 text-gray-800"
                        onChange={(e) => setTempGoal(prev => ({ ...prev, target_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">開始日</label>
                      <input
                        type="date"
                        value={tempGoal.start_date}
                        className="glass-input w-full px-3 py-2 text-gray-800"
                        onChange={(e) => setTempGoal(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-medium text-gray-800">毎月の貯金額</span>
                      <span className="text-lg font-semibold text-blue-600">
                        ¥{calculateMonthlySavings(tempGoal).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={updateSavingsGoal}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 backdrop-blur-sm text-white rounded-xl font-semibold"
                    >
                      <Save className="w-5 h-5" />
                      <span>更新</span>
                    </button>
                    <button
                      onClick={() => setEditingGoal(null)}
                      className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/20 text-gray-800 rounded-xl font-semibold"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">{goal.title}</h4>
                      <p className="text-gray-800">{goal.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <button
                        onClick={() => startEditGoal(goal)}
                        className="glass-text hover:bg-glass-white-weak rounded-xl transition-colors border border-white/10"
                      >
                        <Edit2 className="w-5 h-5 glass-icon" />
                      </button>
                      <button
                        onClick={() => {
                          setGoalToDelete(goal.id)
                          setShowDeleteGoalConfirmModal(true)
                        }}
                        className="text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 glass-shine"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">目標金額</span>
                      <span className="text-lg font-semibold text-gray-800">
                        ¥{goal.target_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">現在の貯金額</span>
                      <span className="text-lg font-semibold text-gray-800">
                        ¥{(goal.current_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">達成予定</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(goal.target_date).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">開始日</span>
                      <span className="font-semibold text-gray-800">
                        {goal.start_date ? new Date(goal.start_date).toLocaleDateString('ja-JP') : '未設定'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">毎月の貯金額</span>
                      <span className="text-lg font-semibold text-blue-600">
                        ¥{calculateMonthlySavings(goal).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed left-0 right-0 bottom-[56px] top-[20px] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glass-glow">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h3>
              <p className="text-gray-800 mb-6">この固定支出を削除しますか？</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false)
                    setExpenseToDelete(null)
                  }}
                  className="glass-button-strong flex-1 px-4 py-3 font-semibold text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (expenseToDelete) {
                      await deleteFixedExpense(expenseToDelete)
                      setShowDeleteConfirmModal(false)
                      setExpenseToDelete(null)
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-400 rounded-xl hover:bg-red-500/30 hover:border-red-400/50 transition-all duration-300 font-semibold glass-shine"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Delete Confirmation Modal */}
      {showDeleteGoalConfirmModal && (
        <div className="fixed left-0 right-0 bottom-[56px] top-[20px] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glass-glow">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">削除の確認</h3>
              <p className="text-gray-800 mb-6">この貯金目標を削除しますか？</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteGoalConfirmModal(false)
                    setGoalToDelete(null)
                  }}
                  className="glass-button-strong flex-1 px-4 py-3 font-semibold text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (goalToDelete) {
                      await deleteSavingsGoal(goalToDelete)
                      setShowDeleteGoalConfirmModal(false)
                      setGoalToDelete(null)
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-400 rounded-xl hover:bg-red-500/30 hover:border-red-400/50 transition-all duration-300 font-semibold glass-shine"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}