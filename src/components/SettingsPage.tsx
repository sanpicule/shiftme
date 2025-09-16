import { useState, useEffect, useCallback } from 'react'
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
  start_date?: string
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
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [modalEditingExpense, setModalEditingExpense] = useState<string | null>(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [showDeleteGoalConfirmModal, setShowDeleteGoalConfirmModal] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)

  const { register: registerIncome, handleSubmit: handleIncomeSubmit, setValue: setIncomeValue } = useForm<IncomeForm>()
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense } = useForm<FixedExpenseForm>()
  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal, setValue: setGoalValue } = useForm<SavingsGoalForm>()
  
  // SP用の独立したフォーム状態
  const { register: registerExpenseSP, handleSubmit: handleExpenseSubmitSP, reset: resetExpenseSP } = useForm<FixedExpenseForm>()
  const { register: registerGoalSP, handleSubmit: handleGoalSubmitSP, reset: resetGoalSP } = useForm<SavingsGoalForm>()

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
    target_date: '',
    start_date: ''
  })

  const fetchData = useCallback(async () => {
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
  }, [user])

  useEffect(() => {
    if (user) {
      fetchData()
    }
    if (userSettings) {
      setIncomeValue('monthly_income', userSettings.monthly_income)
    }
  }, [user, userSettings, setIncomeValue, fetchData])

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
      setShowExpenseForm(false) // SPでフォームを閉じる
      // フォームの入力値をクリア
      setEditingExpenseForm({
        name: '',
        amount: 0,
        category: '住居費'
      })
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
      setShowGoalForm(false) // SPでフォームを閉じる
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

  // モーダル内専用の更新関数
  const updateFixedExpenseInModal = async () => {
    if (!modalEditingExpense || !user) return

    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .update(editingExpenseForm)
        .eq('id', modalEditingExpense)
        .eq('user_id', user.id)

      if (error) throw error

      setModalEditingExpense(null)
      fetchData()
      showSuccess('固定支出を更新しました', `${editingExpenseForm.name}: ¥${editingExpenseForm.amount.toLocaleString()}`)
    } catch (error) {
      console.error('Error updating fixed expense:', error)
      showError('更新に失敗しました', 'もう一度お試しください')
    }
  }

  // SP用の追加処理関数
  const addFixedExpenseSP = async (data: FixedExpenseForm) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('fixed_expenses')
        .insert({ ...data, user_id: user.id })

      if (error) throw error

      resetExpenseSP()
      fetchData()
      showSuccess('固定支出を追加しました', `${data.name}: ¥${data.amount.toLocaleString()}`)
      setShowExpenseForm(false) // SPでフォームを閉じる
    } catch (error) {
      console.error('Error adding fixed expense:', error)
      showError('追加に失敗しました', 'もう一度お試しください')
    }
  }

  // SP用の貯金目標追加処理関数
  const addSavingsGoalSP = async (data: SavingsGoalForm) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('savings_goals')
        .insert({ ...data, user_id: user.id })

      if (error) throw error

      resetGoalSP()
      fetchData()
      showSuccess('貯金目標を追加しました', `${data.title}: ¥${data.target_amount.toLocaleString()}`)
      setShowGoalForm(false) // SPでフォームを閉じる
    } catch (error) {
      console.error('Error adding savings goal:', error)
      showError('追加に失敗しました', 'もう一度お試しください')
    }
  }

  const startEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal.id)
    setEditingGoalForm({
      title: goal.title,
      description: goal.description,
      target_amount: goal.target_amount,
      target_date: goal.target_date,
      start_date: goal.start_date || ''
    })
    // フォームの値も更新
    setGoalValue('title', goal.title)
    setGoalValue('description', goal.description)
    setGoalValue('target_amount', goal.target_amount)
    setGoalValue('target_date', goal.target_date)
    setGoalValue('start_date', goal.start_date || '')
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
        <h1 className="text-2xl font-bold mb-3 glass-text-strong">
          設定
        </h1>
        <p className="text-sm glass-text">収入、固定支出、貯金目標を設定しましょう</p>
      </div>

      {/* Monthly Income Section */}
      <div className="glass-card p-4 hover:shadow-glass-glow transition-all duration-500 glass-shine">
        <div className="flex items-center space-x-4 mb-8">
          <div>
                      <h2 className="text-xl font-semibold glass-text-strong">月収設定</h2>
          <p className="text-sm glass-text">毎月の収入を設定してください</p>
          </div>
        </div>

        {/* 統一されたフォーム表示 */}
        <form onSubmit={handleIncomeSubmit(handleIncomeUpdate)} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold glass-text-strong mb-3">
                月収（円）
              </label>
              <input
                type="number"
                {...registerIncome('monthly_income', { required: true, min: 0 })}
                className="glass-input w-full px-6 py-4 text-lg font-medium"
                placeholder="300000"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="glass-button-strong w-full md:w-auto flex items-center justify-center space-x-3 px-8 py-4 transform hover:-translate-y-1 font-semibold"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? '更新中...' : '更新'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Fixed Expenses Section */}
      <div className="glass-card p-4 hover:shadow-glass-glow transition-all duration-500 glass-shine">
        <div className="flex items-center space-x-4 mb-8">
          <div>
                      <h2 className="text-xl font-semibold glass-text-strong">固定支出管理</h2>
          <p className="text-sm glass-text">毎月の固定支出を管理してください</p>
          </div>
        </div>

        {/* SPのみでフォームを非表示にする */}
        <div className="block md:hidden mb-6">
          {!showExpenseForm ? (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="glass-button-strong w-full flex items-center justify-center space-x-2 px-4 py-3 transform hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>固定支出を追加</span>
            </button>
          ) : (
            <form onSubmit={handleExpenseSubmitSP(addFixedExpenseSP)} className="space-y-4 p-4 glass-card">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">項目名</label>
                  <input
                    type="text"
                    {...registerExpenseSP('name', { required: true })}
                    className="glass-input w-full px-4 py-3"
                    placeholder="家賃"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">金額（円）</label>
                  <input
                    type="number"
                    {...registerExpenseSP('amount', { required: true, min: 0 })}
                    className="glass-input w-full px-4 py-3"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">カテゴリ</label>
                  <select
                    {...registerExpenseSP('category')}
                    className="glass-input w-full px-4 py-3"
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
                  className="glass-button-strong flex-1 flex items-center justify-center space-x-2 px-4 py-3 transform hover:-translate-y-0.5 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>追加</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="glass-button-strong px-4 py-3 font-semibold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* PCでは従来通り表示 */}
        <div className="hidden md:block">
          <form onSubmit={handleExpenseSubmit(editingExpense ? updateFixedExpense : addFixedExpense)} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium glass-text-strong mb-3">項目名</label>
                <input
                  type="text"
                  {...registerExpense('name', { required: true })}
                  className="glass-input w-full px-4 py-3"
                  placeholder="家賃"
                />
              </div>
              <div>
                <label className="block text-sm font-medium glass-text-strong mb-3">金額（円）</label>
                <input
                  type="number"
                  {...registerExpense('amount', { required: true, min: 0 })}
                  className="glass-input w-full px-4 py-3"
                  placeholder="80000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium glass-text-strong mb-3">カテゴリ</label>
                <select
                  {...registerExpense('category')}
                  className="glass-input w-full px-4 py-3"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  className="glass-button-strong flex-1 flex items-center justify-center space-x-2 px-4 py-3 transform hover:-translate-y-0.5 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>追加</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Expenses List - SPでは非表示 */}
        <div className="hidden md:block space-y-4">
          {fixedExpenses.map((expense) => (
            <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 glass-card hover:shadow-glass-glow transition-all duration-300 glass-shine">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500/30 to-indigo-600/30 backdrop-blur-sm border border-blue-400/30 rounded-full shadow-glass-glow"></div>
                <div>
                  {editingExpense === expense.id ? (
                    <input
                      type="text"
                      value={editingExpenseForm.name}
                      className="glass-input w-full px-3 py-1 text-lg font-semibold"
                      onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <h4 className="font-medium glass-text-strong text-base">{expense.name}</h4>
                  )}
                  {editingExpense === expense.id ? (
                    <select
                      value={editingExpenseForm.category}
                      className="glass-input w-full px-3 py-1 mt-1 text-sm"
                      onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm glass-text font-medium">{expense.category}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                {editingExpense === expense.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editingExpenseForm.amount}
                      className="glass-input w-32 px-3 py-1 text-xl font-semibold"
                      onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                    <span className="text-xl font-semibold glass-text-strong">円</span>
                  </div>
                ) : (
                  <span className="text-xl font-semibold glass-text-strong">
                    ¥{expense.amount.toLocaleString()}
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  {editingExpense === expense.id ? (
                    <>
                      <button
                        onClick={updateFixedExpense}
                        className="p-3 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-xl transition-all duration-300 glass-shine"
                      >
                        <Save className="w-5 h-5 glass-icon" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingExpense(null)
                        }}
                        className="p-3 glass-icon hover:text-white hover:bg-glass-white-weak rounded-xl transition-all duration-300 glass-shine"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditExpense(expense)}
                        className="p-3 glass-icon hover:text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all duration-300 glass-shine"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteFixedExpense(expense.id)}
                        className="p-3 glass-icon hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 glass-shine"
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
          <div className="mt-8 p-4 glass-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm glass-text">固定支出合計</p>
                <p className="text-xl font-semibold glass-text-strong">¥{fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}</p>
              </div>
              {/* SPのみで詳細確認ボタンを表示 */}
              <div className="block md:hidden">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="glass-button-strong p-3 glass-shine"
                >
                  <span className="text-sm font-medium">詳細</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Savings Goals Section */}
      <div className="glass-card p-4 hover:shadow-glass-glow transition-all duration-500 glass-shine">
        <div className="flex items-center space-x-4 mb-8">
          <div>
                      <h2 className="text-xl font-semibold glass-text-strong">貯金目標管理</h2>
          <p className="text-sm glass-text">貯金の目標を設定して管理しましょう</p>
          </div>
        </div>

        {/* SPのみでフォームを非表示にする */}
        <div className="block md:hidden mb-6">
          {!showGoalForm ? (
            <button
              onClick={() => setShowGoalForm(true)}
              className="glass-button-strong w-full flex items-center justify-center space-x-2 px-4 py-3 transform hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>貯金目標を追加</span>
            </button>
          ) : (
            <form onSubmit={handleGoalSubmitSP(addSavingsGoalSP)} className="space-y-4 p-4 glass-card">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">目標タイトル</label>
                  <input
                    type="text"
                    {...registerGoalSP('title', { required: true })}
                    className="glass-input w-full px-4 py-3"
                    placeholder="海外旅行の資金"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">目標金額（円）</label>
                  <input
                    type="number"
                    {...registerGoalSP('target_amount', { required: true, min: 0 })}
                    className="glass-input w-full px-4 py-3"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">達成予定日</label>
                  <input
                    type="date"
                    {...registerGoalSP('target_date', { required: true })}
                    className="glass-input w-full px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">目標開始日</label>
                  <input
                    type="date"
                    {...registerGoalSP('start_date')}
                    className="glass-input w-full px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium glass-text-strong mb-2">詳細・説明</label>
                  <textarea
                    {...registerGoalSP('description')}
                    rows={3}
                    className="glass-input w-full px-4 py-3"
                    placeholder="ヨーロッパ周遊旅行のために貯金したい"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="glass-button-strong flex-1 flex items-center justify-center space-x-2 px-4 py-3 transform hover:-translate-y-0.5 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>追加</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="glass-button-strong px-4 py-3 font-semibold"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* PCでは従来通り表示 */}
        <div className="hidden md:block">
          <form onSubmit={handleGoalSubmit(editingGoal ? updateSavingsGoal : addSavingsGoal)} className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium glass-text-strong mb-3">目標タイトル</label>
                <input
                  type="text"
                  {...registerGoal('title', { required: true })}
                  className="glass-input w-full px-4 py-3"
                  placeholder="海外旅行の資金"
                />
              </div>
              <div>
                <label className="block text-sm font-medium glass-text-strong mb-3">目標金額（円）</label>
                <input
                  type="number"
                  {...registerGoal('target_amount', { required: true, min: 0 })}
                  className="glass-input w-full px-4 py-3"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium glass-text-strong mb-3">達成予定日</label>
                <input
                  type="date"
                  {...registerGoal('target_date', { required: true })}
                  className="glass-input w-full px-4 py-3"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  className="glass-button-strong flex-1 flex items-center justify-center space-x-2 px-4 py-3 transform hover:-translate-y-0.5 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>追加</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium glass-text-strong mb-3">詳細・説明</label>
              <textarea
                {...registerGoal('description')}
                rows={3}
                className="glass-input w-full px-4 py-3"
                placeholder="ヨーロッパ周遊旅行のために貯金したい"
              />
            </div>
          </form>
        </div>

        {/* Savings Goals List */}
        <div className="space-y-6">
          {savingsGoals.map((goal) => (
            <div key={goal.id} className="p-4 glass-card hover:shadow-glass-glow transition-all duration-300 glass-shine">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  {editingGoal === goal.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingGoalForm.title}
                        className="glass-input w-full px-4 py-2 text-lg font-semibold"
                        onChange={(e) => setEditingGoalForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                      <textarea
                        value={editingGoalForm.description}
                        rows={2}
                        className="glass-input w-full px-4 py-2"
                        onChange={(e) => setEditingGoalForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-lg font-semibold glass-text-strong mb-2">{goal.title}</h4>
                      <p className="glass-text">{goal.description}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {editingGoal === goal.id ? (
                    <>
                      <button
                        onClick={updateSavingsGoal}
                        className="p-3 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-xl transition-all duration-300 glass-shine"
                      >
                        <Save className="w-5 h-5 glass-icon" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingGoal(null)
                          resetGoal()
                        }}
                        className="p-3 glass-icon hover:text-white hover:bg-glass-white-weak rounded-xl transition-all duration-300 glass-shine"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditGoal(goal)}
                        className="p-3 glass-icon hover:text-purple-400 hover:bg-purple-500/20 rounded-xl transition-all duration-300 glass-shine"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setGoalToDelete(goal.id)
                          setShowDeleteGoalConfirmModal(true)
                        }}
                        className="p-3 glass-icon hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 glass-shine"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between items-center p-4 glass-card">
                  <span className="glass-text font-medium">目標金額:</span>
                  {editingGoal === goal.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={editingGoalForm.target_amount}
                        className="glass-input w-32 px-3 py-1 text-lg font-semibold"
                        onChange={(e) => setEditingGoalForm(prev => ({ ...prev, target_amount: Number(e.target.value) }))}
                      />
                      <span className="text-lg font-semibold glass-text-strong">円</span>
                    </div>
                  ) : (
                    <span className="text-lg font-semibold glass-text-strong">
                      ¥{goal.target_amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center p-4 glass-card">
                  <span className="glass-text font-medium">達成予定:</span>
                  {editingGoal === goal.id ? (
                                          <input
                        type="date"
                        value={editingGoalForm.target_date}
                        className="glass-input px-3 py-1"
                        onChange={(e) => setEditingGoalForm(prev => ({ ...prev, target_date: e.target.value }))}
                      />
                  ) : (
                    <span className="font-semibold glass-text-strong">
                      {new Date(goal.target_date).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center p-4 glass-card">
                  <span className="glass-text font-medium">開始日:</span>
                  {editingGoal === goal.id ? (
                    <input
                      type="date"
                      value={editingGoalForm.start_date}
                      className="glass-input px-3 py-1"
                      onChange={(e) => setEditingGoalForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  ) : (
                    <span className="font-semibold glass-text-strong">
                      {goal.start_date ? new Date(goal.start_date).toLocaleDateString('ja-JP') : '未設定'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Expenses Detail Modal - SPのみ */}
      {showExpenseModal && (
        <div className="fixed left-0 right-0 bottom-[56px] top-[20px] bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-sm max-h-[calc(100vh-180px)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-lg font-bold glass-text-strong">
                {modalEditingExpense ? '固定支出を編集' : '固定支出詳細'}
              </h3>
              <button
                onClick={() => {
                  setShowExpenseModal(false)
                  setModalEditingExpense(null)
                }}
                className="p-2 glass-icon hover:text-white hover:bg-glass-white-weak rounded-xl transition-all duration-300 glass-shine"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto glass-scrollbar">
              {fixedExpenses.map((expense) => (
                <div key={expense.id} className="relative p-4 glass-card glass-shine">
                  {modalEditingExpense === expense.id ? (
                    // 編集フォーム
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold glass-text-strong mb-2">項目名</label>
                        <input
                          type="text"
                          value={editingExpenseForm.name}
                          className="glass-input w-full px-3 py-2"
                          onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold glass-text-strong mb-2">カテゴリ</label>
                        <select
                          value={editingExpenseForm.category}
                          className="glass-input w-full px-3 py-2"
                          onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold glass-text-strong mb-2">金額（円）</label>
                        <input
                          type="number"
                          value={editingExpenseForm.amount}
                          className="glass-input w-full px-3 py-2"
                          onChange={(e) => setEditingExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={updateFixedExpenseInModal}
                          className="glass-button-primary flex-1 flex items-center justify-center space-x-2 px-4 py-2 font-semibold"
                        >
                          <Save className="w-4 h-4" />
                          <span>保存</span>
                        </button>
                        <button
                          onClick={() => setModalEditingExpense(null)}
                          className="glass-button px-4 py-2 font-semibold"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 通常表示
                    <>
                      {/* 編集・削除アイコンを右上に配置 */}
                      <div className="absolute top-3 right-3 flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setModalEditingExpense(expense.id)
                            setEditingExpenseForm({
                              name: expense.name,
                              amount: expense.amount,
                              category: expense.category
                            })
                          }}
                          className="p-2 glass-icon hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300 glass-shine"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setExpenseToDelete(expense.id)
                            setShowDeleteConfirmModal(true)
                          }}
                          className="p-2 glass-icon hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 glass-shine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="pr-16">
                        <h4 className="font-medium glass-text-strong text-base mb-1">{expense.name}</h4>
                        <p className="text-sm glass-text font-medium mb-2">{expense.category}</p>
                        <span className="text-xl font-semibold glass-text-strong">
                          ¥{expense.amount.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {!modalEditingExpense && (
              <div className="p-4 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium glass-text">合計</span>
                  <span className="text-xl font-semibold glass-text-strong">
                    ¥{fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed left-0 right-0 bottom-[56px] top-[20px] bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glass-glow">
                <Trash2 className="w-8 h-8 text-red-400 glass-icon" />
              </div>
              <h3 className="text-lg font-bold glass-text-strong mb-2">削除の確認</h3>
              <p className="glass-text mb-6">この固定支出を削除しますか？</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false)
                    setExpenseToDelete(null)
                  }}
                  className="glass-button-strong flex-1 px-4 py-3 font-semibold"
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
                <Trash2 className="w-8 h-8 text-red-400 glass-icon" />
              </div>
              <h3 className="text-lg font-bold glass-text-strong mb-2">削除の確認</h3>
              <p className="glass-text mb-6">この貯金目標を削除しますか？</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteGoalConfirmModal(false)
                    setGoalToDelete(null)
                  }}
                  className="glass-button-strong flex-1 px-4 py-3 font-semibold"
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