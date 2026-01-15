import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, AlertTriangle, CheckCircle, Edit2, Trash2, Plus, X, Save, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { ExpenseCalendar } from './ExpenseCalendar'
import { LoadingSpinner } from './LoadingSpinner'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase, FixedExpense, SavingsGoal, Expense } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Modal, Box } from '@mui/material'

interface ExpenseForm {
  amount: number
  category: string
  description: string
}

const categories = [
  '食費',
  '交通費',
  '娯楽',
  '衣服',
  '医療',
  '日用品',
  '教育',
  'その他',
]

export function Dashboard() {
  const { user } = useAuth()
  const { userSettings } = useUserSettings()
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const [hideRemaining, setHideRemaining] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<ExpenseForm>({
    defaultValues: {
      category: '食費',
    },
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // コンポーネントのアンマウント時にスクロールを復活
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.position = 'static'
      document.body.style.height = 'auto'
      document.body.style.width = 'auto'
    }
  }, [])

  // モーダルの状態変更を監視してスクロールを制御
  useEffect(() => {
    if (!isModalOpen) {
      // モーダルが閉じられた後に少し遅延してスクロールを復活
      const timer = setTimeout(() => {
        document.body.style.overflow = 'auto'
        document.body.style.position = 'static'
        document.body.style.height = 'auto'
        document.body.style.width = 'auto'
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isModalOpen])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch fixed expenses
      const { data: fixedData } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)

      // Fetch savings goals
      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)

      // Fetch this month's expenses
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('expense_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('expense_date', { ascending: false })

      setFixedExpenses(fixedData || [])
      setSavingsGoals(goalsData || [])
      setExpenses(expensesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseUpdate = () => {
    fetchData()
  }



  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setIsAddingExpense(false)
    setEditingExpense(null)
    reset()
    // bodyのスタイルを元に戻す
    document.body.style.overflow = 'auto'
    document.body.style.position = 'static'
    document.body.style.height = 'auto'
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsModalOpen(true)
    setIsAddingExpense(false)
    setEditingExpense(null)
    reset()
    // bodyのスクロールを無効化
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  }

  const addExpense = async (data: ExpenseForm) => {
    if (!user || !selectedDate) return

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...data,
          user_id: user.id,
          expense_date: format(selectedDate, 'yyyy-MM-dd'),
        })

      if (error) throw error

      reset()
      setIsAddingExpense(false)
      handleExpenseUpdate()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('支出の追加に失敗しました')
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('この支出を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user?.id)

      if (error) throw error
      handleExpenseUpdate()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('削除に失敗しました')
    }
  }

  const startEditExpense = (expense: Expense) => {
    setEditingExpense(expense.id)
    setIsAddingExpense(false)
    setValue('amount', expense.amount)
    setValue('category', expense.category)
    setValue('description', expense.description)
  }

  const updateExpense = async (data: ExpenseForm) => {
    if (!editingExpense) return

    try {
      const { error } = await supabase
        .from('expenses')
        .update(data)
        .eq('id', editingExpense)
        .eq('user_id', user?.id)

      if (error) throw error

      setEditingExpense(null)
      reset()
      handleExpenseUpdate()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('更新に失敗しました')
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Calculations
  const monthlyIncome = userSettings?.monthly_income || 0
  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalMonthlyExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  const savingsGoal = savingsGoals[0] // Assuming one active goal
  const monthlyNeededForGoal = savingsGoal
    ? Math.ceil(savingsGoal.target_amount / Math.max(1, Math.ceil((new Date(savingsGoal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))))
    : 0
  
  const budgetAfterFixed = monthlyIncome - totalFixedExpenses - monthlyNeededForGoal
  const remainingBudget = budgetAfterFixed - totalMonthlyExpenses

  const remainingDays = Math.ceil((new Date(endOfMonth(currentDate)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const dailyBudget = Math.floor(remainingBudget / Math.max(1, remainingDays))
  const weeklyBudget = Math.floor(remainingBudget / Math.max(1, Math.ceil(remainingDays / 7)))

  const totalExpenses = () => {
    if (!selectedDate) return 0
    return expenses.filter(expense => 
      format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    ).reduce((sum, expense) => sum + expense.amount, 0)
  }

  const dailyRemaining = () => {
    if (dailyBudget - totalExpenses() < 0) {
      return 0
    }
    return dailyBudget - totalExpenses()
  }

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Main Budget Display - Hero Section with Glass Effect */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/30 rounded-full -translate-x-16 -translate-y-16 glass-float"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/20 rounded-full translate-x-24 translate-y-24 glass-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/25 rounded-full -translate-x-12 -translate-y-12 glass-float" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Details Toggle Button - Top Right */}
        <div className="absolute top-4 right-0 md:hidden z-20">
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="p-2 backdrop-blur-sm transition-all duration-300 rounded-full glass-text border border-gray-200"
            aria-label={isDetailsExpanded ? '詳細を隠す' : '詳細を確認'}
          >
            {isDetailsExpanded ? (
              <ChevronUp className="w-5 h-5 glass-icon" />
            ) : (
              <ChevronDown className="w-5 h-5 glass-icon" />
            )}
          </button>
        </div>

        {/* Budget Overview Card */}
        <div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            {/* Left Side - Remaining Budget */}
            <div className="flex-1 lg:mb-0 w-full">
              <h3 className="glass-text text-sm mb-2 flex items-center space-x-1">
                <span>残高</span>
                <button
                  onClick={() => setHideRemaining(!hideRemaining)}
                  aria-label={hideRemaining ? '金額を表示' : '金額を非表示'}
                  className="p-1 rounded-full border border-gray-200 transition-colors"
                >
                  {hideRemaining ? (
                    <Eye className="w-3.5 h-3.5 glass-icon" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 glass-icon" />
                  )}
                </button>
              </h3>
              <div className="text-2xl md:text-4xl font-bold glass-text-strong">
                {hideRemaining ? '¥••••••' : `¥${remainingBudget.toLocaleString()}`}
              </div>

              {savingsGoal && (
                <div className={`mt-4 overflow-hidden transition-all duration-500 ease-in-out ${
                  isDetailsExpanded ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
                }`}>
                  <div className="flex flex-col space-y-1">
                    <div className="glass-text-strong font-semibold">
                      {format(new Date(savingsGoal.target_date), 'yyyy年M月', { locale: ja })}までに
                    </div>    
                    <div className="glass-text-strong text-lg font-semibold">
                      ¥{savingsGoal.target_amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quick Stats - 2 columns - Hidden on mobile when collapsed */}
              <div className={`md:block overflow-hidden transition-all duration-500 ease-in-out ${
                isDetailsExpanded ? 'mt-2 max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
              }`}>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                    <div className="text-xs glass-text mb-1">1日あたり</div>
                    <div className="text-base font-bold glass-text-strong">¥{dailyBudget.toLocaleString()}</div>
                  </div>
                  <div className="backdrop-blur-sm rounded-xl p-3 border border-gray-200">
                    <div className="text-xs glass-text mb-1">1週間あたり</div>
                    <div className="text-base font-bold glass-text-strong">¥{weeklyBudget.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div>
        <ExpenseCalendar expenses={expenses} onDateClick={handleDateClick} />
      </div>

      {/* Budget Tips */}
      <div>
        <h3 className="text-base md:text-lg font-bold text-gray-900/90 mb-3 md:mb-4">💡 今月のアドバイス</h3>
        <div className="space-y-3">
            {remainingBudget < 0 && (
              <div className="flex items-start space-x-2 md:space-x-3 p-3 bg-red-500/20 backdrop-blur-sm rounded-xl border border-red-400/30">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-400 mt-0.5 glass-icon" />
                <div>
                  <p className="font-medium text-red-600 text-sm md:text-base text-shadow">予算を超過しています</p>
                  <p className="text-xs md:text-sm text-red-500 text-shadow">支出を見直すか、来月の計画を調整しましょう</p>
                </div>
              </div>
            )}

            {remainingBudget > 0 && remainingBudget < budgetAfterFixed * 0.2 && (
              <div className="flex items-start space-x-2 md:space-x-3 p-3 bg-yellow-500/20 backdrop-blur-sm rounded-xl border border-yellow-400/30">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-800 mt-0.5 glass-icon" />
                <div>
                  <p className="font-medium text-yellow-900 text-sm md:text-base text-shadow">予算残りわずかです</p>
                  <p className="text-xs md:text-sm text-yellow-900 text-shadow">残り{Math.ceil((new Date(endOfMonth(currentDate)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日間、計画的に使いましょう</p>
                </div>
              </div>
            )}

            {remainingBudget >= budgetAfterFixed * 0.2 && (
              <div className="flex items-start space-x-2 md:space-x-3 p-3 bg-green-500/20 rounded-xl border border-green-400">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 mt-0.5 glass-icon" />
                <div>
                  <p className="font-medium text-gray-800 text-sm md:text-base text-shadow">順調に管理できています</p>
                  <p className="text-xs md:text-sm text-gray-800 text-shadow">この調子で貯金目標を達成しましょう！</p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && selectedDate && (
        <Modal
          open={isModalOpen}
          onClose={closeModal}
          keepMounted={false}
          aria-labelledby="expense-modal-title"
          aria-describedby="expense-modal-description"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(255, 255, 255)',
              backdropFilter: 'blur(8px)',
            },
          }}
        >
        <Box
          className="glass-modal glass-shine glass-scrollbar overflow-y-scroll"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95vw',
            maxWidth: '1200px',
            maxHeight: '90vh',
            bgcolor: 'transparent',
            borderRadius: '24px',
            boxShadow: 'none',
            outline: 'none',
            overflow: 'hidden',
            '@media (min-width: 1024px)': {
              width: '80vw',
              maxWidth: '1000px',
            },
            '@media (min-width: 1280px)': {
              width: '70vw',
              maxWidth: '900px',
            },
            '@media (max-width: 640px)': {
              width: '100vw',
              height: '100vh',
              maxHeight: '100vh',
              borderRadius: '0',
            },
          }}
        >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20 bg-transparent">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 glass-icon" />
                <div>
                  <h2 className="text-xl font-bold glass-text-strong">
                    {format(selectedDate, 'MM月dd日（E）', { locale: ja })}
                  </h2>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="glass-text p-2 hover:bg-glass-white-weak rounded-lg transition-colors border border-white/10"
              >
                <X className="w-6 h-6 glass-icon" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 h-[90vh] overflow-y-scroll glass-scrollbar">
              {/* Add Expense Button */}
              {!isAddingExpense && !editingExpense && (
                <div className="mb-6">
                  <button
                    onClick={() => setIsAddingExpense(true)}
                    className="w-full flex items-center justify-center space-x-3 glass-button-primary text-white px-4 sm:px-6 py-4"
                  >
                    <Plus className="w-5 h-5 glass-icon" />
                    <span className="font-medium glass-text-strong">新しい支出を追加</span>
                  </button>
                </div>
              )}

              <div className="mb-4 text-md glass-text">
                あと
                <span className='font-bold text-gray-800 text-3xl glass-text-strong mx-1'>
                  {dailyRemaining().toLocaleString()}
                </span>
                円使えます！
              </div>

              {/* Add/Edit Expense Form */}
              {(isAddingExpense || editingExpense) && (
                <div className="mb-6 p-6 glass-card">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold glass-text-strong">
                        {editingExpense ? '支出を編集' : '支出を追加'}
                      </h3>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit(editingExpense ? updateExpense : addExpense)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-semibold glass-text mb-3">金額（円）</label>
                        <input
                          type="number"
                          {...register('amount', { required: true, min: 0 })}
                          className="w-full px-4 py-3 rounded-xl transition-all duration-200 text-lg font-medium glass-input"
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold glass-text mb-3">カテゴリ</label>
                        <select
                          {...register('category', { required: true })}
                          className="w-full px-4 py-3 rounded-xl transition-all duration-200 glass-input"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold glass-text mb-3">説明・メモ</label>
                      <input
                        type="text"
                        {...register('description')}
                        className="w-full px-4 py-3 rounded-xl transition-all duration-200 glass-input"
                        placeholder="コンビニで昼食"
                      />
                    </div>
                    
                    <div className="flex space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingExpense(false)
                          setEditingExpense(null)
                          reset()
                        }}
                        className="flex-1 px-6 py-3 glass-button font-medium"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 glass-button-primary text-white bg-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <Save className="w-4 h-4 text-white" />
                            <span>{editingExpense ? '更新' : '追加'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Expenses List */}
              {selectedDate && expenses.filter(expense => 
                format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              ).length > 0 ? (
                <div className="space-y-4 overflow-auto">
                  <h3 className="text-lg font-semibold glass-text-strong flex items-center space-x-2">
                    <span>この日の支出</span>
                    <span className="text-sm font-normal glass-text">({expenses.filter(expense => 
                      format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ).length}件)</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {expenses.filter(expense => 
                      format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-start justify-between p-4 glass-card transition-all duration-200"
                      >
                        <div className="flex-1 sm:mb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                            <span className="bg-glass-white-weak text-gray-800 text-sm font-medium rounded-full w-fit">
                              カテゴリ：{expense.category}
                            </span>
                            <span className="text-xl font-bold glass-text-strong">
                              ¥{expense.amount.toLocaleString()}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="text-sm glass-text mt-2">{expense.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 sm:ml-4">
                          <button 
                            onClick={() => startEditExpense(expense)}
                            className="glass-text hover:bg-glass-white-weak rounded-xl transition-colors border border-white/10"
                            title="編集"
                          >
                            <Edit2 className="w-5 h-5 glass-icon" />
                          </button>
                          <button 
                            onClick={() => deleteExpense(expense.id)}
                            className="text-red-400 md:hover:bg-red-500/20 rounded-xl transition-all duration-300 glass-shine"
                            title="削除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Day Total */}
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold glass-text">この日の合計</span>
                      <span className="text-3xl font-bold glass-text-strong">
                        ¥{totalExpenses().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                !isAddingExpense && !editingExpense && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-glass-white-weak backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-10 h-10 glass-icon" />
                    </div>
                    <h3 className="text-lg font-semibold glass-text-strong mb-2">支出がありません</h3>
                    <p className="glass-text mb-6">この日の支出はまだ記録されていません</p>
                    <button
                      onClick={() => setIsAddingExpense(true)}
                      className="inline-flex items-center space-x-2 glass-button-primary text-white px-8 py-4 rounded-2xl"
                    >
                      <Plus className="w-5 h-5 glass-icon" />
                      <span className="font-medium glass-text-strong">最初の支出を追加</span>
                    </button>
                  </div>
                )
              )}
            </div>
          </Box>
        </Modal>
      )}
    </div>
  )
}