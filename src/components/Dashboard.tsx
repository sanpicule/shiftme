import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar, AlertTriangle, CheckCircle, Edit2, Trash2, Plus, X, Save, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
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
        <LoadingSpinner size="lg" text="データを読み込み中..." />
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

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Main Budget Display - Hero Section with Pink Gradient */}
      <div className="relative overflow-hidden text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full -translate-x-12 -translate-y-12"></div>
        </div>

        {/* Details Toggle Button - Top Right */}
        <div className="absolute top-4 right-4 md:hidden z-20">
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            className="p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 rounded-full text-white/90 hover:scale-110"
            aria-label={isDetailsExpanded ? '詳細を隠す' : '詳細を確認'}
          >
            {isDetailsExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Budget Overview Card */}
        <div className="bg-gradient-to-r from-gray-800 via-blue-800 to-blue-900 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            {/* Left Side - Remaining Budget */}
            <div className="flex-1 lg:mb-0 w-full">
              <h3 className="text-white/80 text-sm mb-2">今月の残り使えるお金</h3>
              <div className="text-4xl font-bold text-white">
                ¥{remainingBudget.toLocaleString()}
              </div>
              
              {/* Quick Stats - 2 columns - Hidden on mobile when collapsed */}
              <div className={`md:block overflow-hidden transition-all duration-500 ease-in-out ${
                isDetailsExpanded ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
              }`}>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {(() => {
                    const remainingDays = Math.ceil((new Date(endOfMonth(currentDate)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    const dailyBudget = Math.floor(remainingBudget / Math.max(1, remainingDays))
                    const weeklyBudget = Math.floor(remainingBudget / Math.max(1, Math.ceil(remainingDays / 7)))
                    
                    return (
                      <>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                          <div className="text-xs text-white/70 mb-1">1日あたり</div>
                          <div className="text-base font-bold text-white">¥{dailyBudget.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                          <div className="text-xs text-white/70 mb-1">1週間あたり</div>
                          <div className="text-base font-bold text-white">¥{weeklyBudget.toLocaleString()}</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Right Side - Savings Goal - Hidden on mobile when collapsed */}
            {savingsGoal && (
              <div className={`lg:ml-8 overflow-hidden transition-all duration-500 ease-in-out ${
                isDetailsExpanded ? 'mt-4 max-h-96 opacity-100' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'
              }`}>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium w-24">
                      いつまでに
                    </div>
                    <div className="text-white font-semibold ml-3">
                      {format(new Date(savingsGoal.target_date), 'yyyy年M月', { locale: ja })}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium w-24">
                      いくら
                    </div>
                    <div className="text-white font-semibold ml-3">
                      ¥{savingsGoal.target_amount.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium w-24">
                      目標
                    </div>
                    <div className="text-white font-semibold ml-3">
                      {savingsGoal.title}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20 p-4 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">支出カレンダー</h2>
            <p className="text-xs md:text-sm text-gray-600">日付をクリックして支出を入力・確認できます</p>
          </div>
        </div>

        <ExpenseCalendar expenses={expenses} onDateClick={handleDateClick} />
      </div>

      {/* Budget Tips */}
      <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-white/20 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">💡 今月のアドバイス</h3>
        <div className="space-y-3">
          {remainingBudget < 0 && (
            <div className="flex items-start space-x-2 md:space-x-3 p-3 bg-red-50/80 rounded-xl border border-red-200/50">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 text-sm md:text-base">予算を超過しています</p>
                <p className="text-xs md:text-sm text-red-600">支出を見直すか、来月の計画を調整しましょう</p>
              </div>
            </div>
          )}
          
          {remainingBudget > 0 && remainingBudget < budgetAfterFixed * 0.2 && (
            <div className="flex items-start space-x-2 md:space-x-3 p-3 bg-yellow-50/80 rounded-xl border border-yellow-200/50">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 text-sm md:text-base">予算残りわずかです</p>
                <p className="text-xs md:text-sm text-yellow-600">残り{Math.ceil((new Date(endOfMonth(currentDate)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日間、計画的に使いましょう</p>
              </div>
            </div>
          )}
          
          {remainingBudget >= budgetAfterFixed * 0.2 && (
            <div className="flex items-start space-x-2 md:space-x-3 p-3 bg-green-50/80 rounded-xl border border-green-200/50">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 text-sm md:text-base">順調に管理できています</p>
                <p className="text-xs md:text-sm text-green-600">この調子で貯金目標を達成しましょう！</p>
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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
            },
          }}
        >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95vw',
            maxWidth: '1200px',
            maxHeight: '90vh',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {format(selectedDate, 'MM月dd日（E）', { locale: ja })}
                  </h2>
                  <p className="text-sm text-gray-600">支出の管理</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Add Expense Button */}
              {!isAddingExpense && !editingExpense && (
                <div className="mb-6">
                  <button
                    onClick={() => setIsAddingExpense(true)}
                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">新しい支出を追加</span>
                  </button>
                </div>
              )}

              {/* Add/Edit Expense Form */}
              {(isAddingExpense || editingExpense) && (
                <div className="mb-6 p-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingExpense ? '支出を編集' : '支出を追加'}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setIsAddingExpense(false)
                        setEditingExpense(null)
                        reset()
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit(editingExpense ? updateExpense : addExpense)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">金額（円）</label>
                        <input
                          type="number"
                          {...register('amount', { required: true, min: 0 })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">カテゴリ</label>
                        <select
                          {...register('category', { required: true })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">説明・メモ</label>
                      <input
                        type="text"
                        {...register('description')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <span>この日の支出</span>
                    <span className="text-sm font-normal text-gray-500">({expenses.filter(expense => 
                      format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ).length}件)</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {expenses.filter(expense => 
                      format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                    ).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1 mb-3 sm:mb-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <span className="text-xl font-bold text-gray-900">
                              ¥{expense.amount.toLocaleString()}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full w-fit">
                              {expense.category}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="text-sm text-gray-600 mt-2">{expense.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 sm:ml-4">
                          <button 
                            onClick={() => startEditExpense(expense)}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="編集"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteExpense(expense.id)}
                            className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Day Total */}
                  <div className="mt-6 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200/50">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">この日の合計</span>
                      <span className="text-3xl font-bold text-orange-600">
                        ¥{expenses.filter(expense => 
                          format(new Date(expense.expense_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                        ).reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                !isAddingExpense && !editingExpense && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">支出がありません</h3>
                    <p className="text-gray-500 mb-6">この日の支出はまだ記録されていません</p>
                    <button
                      onClick={() => setIsAddingExpense(true)}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">最初の支出を追加</span>
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