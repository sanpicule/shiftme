import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { useUserSettings } from '../hooks/useUserSettings'
import { useToast } from './ToastContainer'
import { supabase, FixedExpense, SavingsGoal } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface IncomeForm {
  monthly_income: number
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
  target_date: string
}

export function SettingsPage() {
  const { user } = useAuth()
  const { userSettings, updateUserSettings } = useUserSettings()
  const { showSuccess, showError } = useToast()
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register: registerIncome, handleSubmit: handleIncomeSubmit, setValue: setIncomeValue } = useForm<IncomeForm>()
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense } = useForm<FixedExpenseForm>()
  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal, setValue: setGoalValue } = useForm<SavingsGoalForm>()

  // 編集用のフォーム状態
  const [editingExpenseForm, setEditingExpenseForm] = useState<FixedExpenseForm>({
    name: '',
    amount: 0,
    category: '住居費'
  })
  const [editingGoalForm, setEditingGoalForm] = useState<SavingsGoalForm>({
    title: '',
    description: '',
    target_amount: 0,
    target_date: ''
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
    if (userSettings) {
      setIncomeValue('monthly_income', userSettings.monthly_income)
    }
  }, [user, userSettings])

  const fetchData = async () => {
    if (!user) return

    try {
      const { data: fixedData } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setFixedExpenses(fixedData || [])
      setSavingsGoals(goalsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleIncomeUpdate = async (data: IncomeForm) => {
    setLoading(true)
    try {
      await updateUserSettings({ monthly_income: data.monthly_income })
      showSuccess('月収を更新しました', `新しい月収: ¥${data.monthly_income.toLocaleString()}`)
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
      fetchData()
      showSuccess('固定支出を追加しました', `${data.name}: ¥${data.amount.toLocaleString()}`)
    } catch (error) {
      console.error('Error adding fixed expense:', error)
      showError('追加に失敗しました', 'もう一度お試しください')
    }
  }

  const deleteFixedExpense = async (id: string) => {
    if (!confirm('この固定支出を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
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
      fetchData()
      showSuccess('貯金目標を追加しました', `${data.title}: ¥${data.target_amount.toLocaleString()}`)
    } catch (error) {
      console.error('Error adding savings goal:', error)
      showError('追加に失敗しました', 'もう一度お試しください')
    }
  }

  const deleteSavingsGoal = async (id: string) => {
    if (!confirm('この貯金目標を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchData()
      showSuccess('貯金目標を削除しました')
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      showError('削除に失敗しました', 'もう一度お試しください')
    }
  }

  const startEditExpense = (expense: FixedExpense) => {
    setEditingExpense(expense.id)
    setEditingExpenseForm({
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
        .update(editingExpenseForm)
        .eq('id', editingExpense)
        .eq('user_id', user.id)

      if (error) throw error

      setEditingExpense(null)
      fetchData()
      showSuccess('固定支出を更新しました', `${editingExpenseForm.name}: ¥${editingExpenseForm.amount.toLocaleString()}`)
    } catch (error) {
      console.error('Error updating fixed expense:', error)
      showError('更新に失敗しました', 'もう一度お試しください')
    }
  }

  const startEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal.id)
    setEditingGoalForm({
      title: goal.title,
      description: goal.description,
      target_amount: goal.target_amount,
      target_date: goal.target_date
    })
  }

  const updateSavingsGoal = async () => {
    if (!editingGoal || !user) return

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update(editingGoalForm)
        .eq('id', editingGoal)
        .eq('user_id', user.id)

      if (error) throw error

      setEditingGoal(null)
      fetchData()
      showSuccess('貯金目標を更新しました', `${editingGoalForm.title}: ¥${editingGoalForm.target_amount.toLocaleString()}`)
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black mb-3">
          設定
        </h1>
        <p className="text-md text-gray-600">収入、固定支出、貯金目標を設定しましょう</p>
      </div>

      {/* Monthly Income Section */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 hover:shadow-3xl transition-all duration-500">
        <div className="flex items-center space-x-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">月収設定</h2>
            <p className="text-gray-600">毎月の収入を設定してください</p>
          </div>
        </div>

        <form onSubmit={handleIncomeSubmit(handleIncomeUpdate)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              月収（円）
            </label>
            <input
              type="number"
              {...registerIncome('monthly_income', { required: true, min: 0 })}
              className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg font-medium bg-white/50 backdrop-blur-sm shadow-lg"
              placeholder="300000"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40 transform hover:-translate-y-1 font-semibold"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? '更新中...' : '更新'}</span>
          </button>
        </form>
      </div>

      {/* Fixed Expenses Section */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 hover:shadow-3xl transition-all duration-500">
        <div className="flex items-center space-x-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">固定支出管理</h2>
            <p className="text-gray-600">毎月の固定支出を管理してください</p>
          </div>
        </div>

        {/* Add Fixed Expense Form */}
        <form onSubmit={handleExpenseSubmit(editingExpense ? updateFixedExpense : addFixedExpense)} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">項目名</label>
              <input
                type="text"
                {...registerExpense('name', { required: true })}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                placeholder="家賃"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">金額（円）</label>
              <input
                type="number"
                {...registerExpense('amount', { required: true, min: 0 })}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                placeholder="80000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">カテゴリ</label>
              <select
                {...registerExpense('category')}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>追加</span>
              </button>
            </div>
          </div>
        </form>

        {/* Fixed Expenses List */}
        <div className="space-y-4">
          {fixedExpenses.map((expense) => (
            <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg"></div>
                <div>
                  {editingExpense === expense.id ? (
                    <input
                      type="text"
                      value={editingExpenseForm.name}
                      className="w-full px-3 py-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-lg font-semibold"
                      onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <h4 className="font-semibold text-gray-900 text-lg">{expense.name}</h4>
                  )}
                  {editingExpense === expense.id ? (
                    <select
                      value={editingExpenseForm.category}
                      className="w-full px-3 py-1 mt-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-sm"
                      onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600 font-medium">{expense.category}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                {editingExpense === expense.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editingExpenseForm.amount}
                      className="w-32 px-3 py-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-2xl font-bold"
                      onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                    <span className="text-2xl font-bold text-gray-900">円</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    ¥{expense.amount.toLocaleString()}
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  {editingExpense === expense.id ? (
                    <>
                      <button
                        onClick={updateFixedExpense}
                        className="p-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-300"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingExpense(null)
                        }}
                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditExpense(expense)}
                        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteFixedExpense(expense.id)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {fixedExpenses.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">固定支出合計</span>
              <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ¥{fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Savings Goals Section */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 hover:shadow-3xl transition-all duration-500">
        <div className="flex items-center space-x-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">貯金目標管理</h2>
            <p className="text-gray-600">貯金の目標を設定して管理しましょう</p>
          </div>
        </div>

        {/* Add Savings Goal Form */}
        <form onSubmit={handleGoalSubmit(editingGoal ? updateSavingsGoal : addSavingsGoal)} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">目標タイトル</label>
              <input
                type="text"
                {...registerGoal('title', { required: true })}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                placeholder="海外旅行の資金"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">目標金額（円）</label>
              <input
                type="number"
                {...registerGoal('target_amount', { required: true, min: 0 })}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">達成予定日</label>
              <input
                type="date"
                {...registerGoal('target_date', { required: true })}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-0.5 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>追加</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">詳細・説明</label>
            <textarea
              {...registerGoal('description')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              placeholder="ヨーロッパ周遊旅行のために貯金したい"
            />
          </div>
        </form>

        {/* Savings Goals List */}
        <div className="space-y-6">
          {savingsGoals.map((goal) => (
            <div key={goal.id} className="p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {editingGoal === goal.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        defaultValue={goal.title}
                        className="w-full px-4 py-2 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-xl font-bold"
                        onChange={(e) => setGoalValue('title', e.target.value)}
                      />
                      <textarea
                        defaultValue={goal.description}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        onChange={(e) => setGoalValue('description', e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{goal.title}</h4>
                      <p className="text-gray-600">{goal.description}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {editingGoal === goal.id ? (
                    <>
                      <button
                        onClick={() => handleGoalSubmit(updateSavingsGoal)()}
                        className="p-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-300"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingGoal(null)
                          resetGoal()
                        }}
                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditGoal(goal)}
                        className="p-3 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all duration-300"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteSavingsGoal(goal.id)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                  <span className="text-gray-600 font-medium">目標金額:</span>
                  {editingGoal === goal.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        defaultValue={goal.target_amount}
                        className="w-32 px-3 py-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-xl font-bold"
                        onChange={(e) => setGoalValue('target_amount', Number(e.target.value))}
                      />
                      <span className="text-xl font-bold text-gray-900">円</span>
                    </div>
                  ) : (
                    <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ¥{goal.target_amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
                  <span className="text-gray-600 font-medium">達成予定:</span>
                  {editingGoal === goal.id ? (
                    <input
                      type="date"
                      defaultValue={goal.target_date}
                      className="px-3 py-1 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      onChange={(e) => setGoalValue('target_date', e.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {new Date(goal.target_date).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}