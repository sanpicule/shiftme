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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          おかえりなさい！
        </h1>
        <p className="text-gray-600">
          {format(currentDate, 'yyyy年MM月', { locale: ja })}の家計管理
        </p>
      </div>

      {/* Main Budget Display - Hero Section */}
      <div className="bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <StatusIcon className={`w-8 h-8 text-${budgetStatus.color}-500`} />
            <h2 className="text-2xl font-bold text-gray-800">今月の残り予算</h2>
          </div>
          
          <div className="relative">
            <div className={`text-6xl md:text-8xl font-black mb-4 ${
              remainingBudget < 0 ? 'text-red-600' : 
              remainingBudget < budgetAfterFixed * 0.2 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              ¥{Math.abs(remainingBudget).toLocaleString()}
            </div>
            {remainingBudget < 0 && (
              <div className="absolute -top-4 -right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                予算超過
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40">
              <div className="text-sm text-gray-600 mb-1">今月の予算</div>
              <div className="text-2xl font-bold text-blue-600">¥{budgetAfterFixed.toLocaleString()}</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40">
              <div className="text-sm text-gray-600 mb-1">使用済み</div>
              <div className="text-2xl font-bold text-orange-600">¥{totalMonthlyExpenses.toLocaleString()}</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40">
              <div className="text-sm text-gray-600 mb-1">使用率</div>
              <div className={`text-2xl font-bold ${
                progressPercentage > 90 ? 'text-red-600' : 
                progressPercentage > 70 ? 'text-yellow-600' : 
                'text-green-600'
              }`}>
                {progressPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="relative">
              <div className="w-full bg-gray-200/50 rounded-full h-6 overflow-hidden">
                <div
                  className={`h-6 rounded-full transition-all duration-1000 ease-out ${
                    progressPercentage > 90 ? 'bg-gradient-to-r from-red-400 to-red-600' : 
                    progressPercentage > 70 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                    'bg-gradient-to-r from-green-400 to-green-600'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              {progressPercentage > 100 && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>0%</span>
              <span className="font-medium">
                {remainingBudget < 0 ? '予算超過中' : `残り${(100 - progressPercentage).toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">月収</div>
            <div className="text-lg font-bold text-gray-900">¥{monthlyIncome.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">固定支出</div>
            <div className="text-lg font-bold text-gray-900">¥{totalFixedExpenses.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">貯金目標</div>
            <div className="text-lg font-bold text-purple-600">¥{monthlyNeededForGoal.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">支出記録</div>
            <div className="text-lg font-bold text-orange-600">{expenses.length}件</div>
          </div>
        </div>
      </div>

      {/* Savings Goal Progress */}
      {savingsGoal && (
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{savingsGoal.title}</h3>
                <p className="text-sm text-gray-600">{savingsGoal.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">目標</p>
              <p className="text-xl font-bold text-purple-600">
                ¥{savingsGoal.target_amount.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>達成予定: {format(new Date(savingsGoal.target_date), 'yyyy年MM月dd日', { locale: ja })}</span>
            <span>月間必要額: ¥{monthlyNeededForGoal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Calendar Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">支出カレンダー</h2>
            <p className="text-sm text-gray-600">日付をクリックして支出を入力・確認できます</p>
          </div>
        </div>

        <ExpenseCalendar expenses={expenses} onExpenseUpdate={handleExpenseUpdate} />
      </div>

      {/* Budget Tips */}
      <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💡 今月のアドバイス</h3>
        <div className="space-y-3">
          {remainingBudget < 0 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50/80 rounded-xl border border-red-200/50">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">予算を超過しています</p>
                <p className="text-sm text-red-600">支出を見直すか、来月の計画を調整しましょう</p>
              </div>
            </div>
          )}
          
          {remainingBudget > 0 && remainingBudget < budgetAfterFixed * 0.2 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50/80 rounded-xl border border-yellow-200/50">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">予算残りわずかです</p>
                <p className="text-sm text-yellow-600">残り{Math.ceil((new Date(endOfMonth(currentDate)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日間、計画的に使いましょう</p>
              </div>
            </div>
          )}
          
          {remainingBudget >= budgetAfterFixed * 0.2 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50/80 rounded-xl border border-green-200/50">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">順調に管理できています</p>
                <p className="text-sm text-green-600">この調子で貯金目標を達成しましょう！</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}