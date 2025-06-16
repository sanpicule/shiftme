import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TrendingUp, TrendingDown, BarChart3, PieChart, Calendar, Target } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase, Expense, FixedExpense, SavingsGoal } from '../lib/supabase'

interface MonthlyData {
  month: string
  expenses: number
  budget: number
}

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

export function AnalyticsPage() {
  const { user } = useAuth()
  const { userSettings } = useUserSettings()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([])
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([])
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '1year'>('3months')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, timeRange])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const now = new Date()
      let startDate: Date

      switch (timeRange) {
        case '3months':
          startDate = subMonths(now, 3)
          break
        case '6months':
          startDate = subMonths(now, 6)
          break
        case '1year':
          startDate = startOfYear(now)
          break
      }

      // Fetch expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
        .lte('expense_date', format(now, 'yyyy-MM-dd'))
        .order('expense_date', { ascending: true })

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

      setExpenses(expensesData || [])
      setFixedExpenses(fixedData || [])
      setSavingsGoals(goalsData || [])
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate monthly data
  const getMonthlyData = (): MonthlyData[] => {
    const months: MonthlyData[] = []
    const now = new Date()
    const monthsCount = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      })

      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const monthlyIncome = userSettings?.monthly_income || 0
      const savingsGoal = savingsGoals[0]
      const monthlyNeededForGoal = savingsGoal
        ? Math.ceil(savingsGoal.target_amount / Math.max(1, Math.ceil((new Date(savingsGoal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))))
        : 0
      
      const budget = monthlyIncome - totalFixed - monthlyNeededForGoal

      months.push({
        month: format(monthDate, 'MM月', { locale: ja }),
        expenses: totalExpenses,
        budget: budget,
      })
    }

    return months
  }

  // Calculate category data
  const getCategoryData = (): CategoryData[] => {
    const categoryTotals: { [key: string]: number } = {}
    const totalExpenses = expenses.reduce((sum, expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
      return sum + expense.amount
    }, 0)

    const colors = [
      '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#10B981', '#F97316', '#6366F1', '#EC4899'
    ]

    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  const monthlyData = getMonthlyData()
  const categoryData = getCategoryData()
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averageMonthlyExpenses = monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0
  const currentMonthExpenses = monthlyData[monthlyData.length - 1]?.expenses || 0
  const previousMonthExpenses = monthlyData[monthlyData.length - 2]?.expenses || 0
  const expensesTrend = previousMonthExpenses > 0 ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">分析</h1>
          <p className="text-gray-600">支出パターンと貯金の進捗を詳しく分析しましょう</p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="3months">過去3ヶ月</option>
            <option value="6months">過去6ヶ月</option>
            <option value="1year">過去1年</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">総支出</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">月平均支出</p>
              <p className="text-2xl font-bold text-gray-900">
                ¥{Math.round(averageMonthlyExpenses).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">前月比</p>
              <p className={`text-2xl font-bold ${expensesTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {expensesTrend > 0 ? '+' : ''}{expensesTrend.toFixed(1)}%
              </p>
            </div>
            <div className={`p-3 rounded-xl ${expensesTrend > 0 ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-green-400 to-green-600'}`}>
              {expensesTrend > 0 ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">支出記録数</p>
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length}件
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">月別支出推移</h2>
        </div>

        <div className="space-y-4">
          {monthlyData.map((data, index) => {
            const percentage = data.budget > 0 ? (data.expenses / data.budget) * 100 : 0
            const isOverBudget = percentage > 100

            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{data.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      予算: ¥{data.budget.toLocaleString()}
                    </span>
                    <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                      ¥{data.expenses.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isOverBudget 
                          ? 'bg-gradient-to-r from-red-400 to-red-600' 
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {isOverBudget && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">カテゴリ別支出</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category List */}
          <div className="space-y-4">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-900">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ¥{category.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {categoryData.map((category, index) => {
                  const startAngle = categoryData
                    .slice(0, index)
                    .reduce((sum, cat) => sum + (cat.percentage / 100) * 360, 0)
                  const endAngle = startAngle + (category.percentage / 100) * 360
                  const largeArcFlag = category.percentage > 50 ? 1 : 0
                  
                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                  const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180)
                  const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180)

                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={category.color}
                      className="hover:opacity-80 transition-opacity"
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ¥{totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">総支出</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}