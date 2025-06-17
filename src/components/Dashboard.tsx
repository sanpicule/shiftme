import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import { PiggyBank, TrendingUp, Calendar, Target, Wallet, ArrowUp, ArrowDown, AlertTriangle, CheckCircle } from 'lucide-react'
import { ExpenseCalendar } from './ExpenseCalendar'
import { LoadingSpinner } from './LoadingSpinner'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase, FixedExpense, SavingsGoal, Expense } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function Dashboard() {
  const { user } = useAuth()
  const { userSettings } = useUserSettings()
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate] = useState(new Date())

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

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

  const progressPercentage = budgetAfterFixed > 0 
    ? Math.min((totalMonthlyExpenses / budgetAfterFixed) * 100, 100)
    : 0

  const getBudgetStatus = () => {
    if (remainingBudget < 0) return { status: 'danger', icon: AlertTriangle, color: 'red' }
    if (remainingBudget < budgetAfterFixed * 0.2) return { status: 'warning', icon: AlertTriangle, color: 'yellow' }
    return { status: 'good', icon: CheckCircle, color: 'green' }
  }

  const budgetStatus = getBudgetStatus()
  const StatusIcon = budgetStatus.icon

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          おかえりなさい！
        </h1>
        <p className="text-gray-600">
          {format(currentDate, 'yyyy年MM月', { locale: ja })}の家計管理
        </p>
      </div>

      {/* Main Budget Display - Hero Section with Pink Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-400 via-purple-500 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-24 translate-y-24"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full -translate-x-12 -translate-y-12"></div>
        </div>

        <div className="relative z-10">
          <div className="text-left mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-medium text-white/90 mb-2">今月の残り使用可能額</h2>
            
            <div className="mb-4">
              <div className="text-4xl md:text-6xl lg:text-7xl font-black mb-2">
                ¥{Math.abs(remainingBudget).toLocaleString()}
              </div>
              {remainingBudget < 0 && (
                <div className="inline-flex items-center bg-red-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">予算超過</span>
                </div>
              )}
            </div>

            <div className="text-sm text-white/80 mb-6">
              使用済み: ¥{totalMonthlyExpenses.toLocaleString()} / 予算: ¥{budgetAfterFixed.toLocaleString()}
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                    progressPercentage > 90 ? 'bg-red-400' : 
                    progressPercentage > 70 ? 'bg-yellow-400' : 
                    'bg-white'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/70 mt-2">
                <span>0%</span>
                <span className="font-medium">
                  {remainingBudget < 0 ? '予算超過中' : `残り${(100 - progressPercentage).toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-xs text-white/70 mb-1">月収</div>
              <div className="text-lg font-bold">¥{monthlyIncome.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-xs text-white/70 mb-1">固定支出</div>
              <div className="text-lg font-bold">¥{totalFixedExpenses.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-xs text-white/70 mb-1">貯金目標</div>
              <div className="text-lg font-bold">¥{monthlyNeededForGoal.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-xs text-white/70 mb-1">支出記録</div>
              <div className="text-lg font-bold">{expenses.length}件</div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Goal Progress */}
      {savingsGoal && (
        <div className="bg-white/70 backdrop-blur-sm p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg md:rounded-xl">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">{savingsGoal.title}</h3>
                <p className="text-xs md:text-sm text-gray-600">{savingsGoal.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs md:text-sm text-gray-600">目標</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">
                ¥{savingsGoal.target_amount.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
            <span>達成予定: {format(new Date(savingsGoal.target_date), 'yyyy年MM月dd日', { locale: ja })}</span>
            <span>月間必要額: ¥{monthlyNeededForGoal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Calendar Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg md:rounded-xl">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">支出カレンダー</h2>
            <p className="text-xs md:text-sm text-gray-600">日付をクリックして支出を入力・確認できます</p>
          </div>
        </div>

        <ExpenseCalendar expenses={expenses} onExpenseUpdate={handleExpenseUpdate} />
      </div>

      {/* Budget Tips */}
      <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg border border-white/20 p-4 md:p-6">
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
    </div>
  )
}