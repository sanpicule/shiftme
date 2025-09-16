import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { BarChart3, PieChart, Target } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase, Expense, FixedExpense, SavingsGoal } from '../lib/supabase'
import { LoadingSpinner } from './LoadingSpinner'

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
  const [timeRange, setTimeRange] = useState<'current' | 'all'>('current')
  const [loading, setLoading] = useState(true)
  const [allExpenses, setAllExpenses] = useState<Expense[]>([])
  const [isMobile, setIsMobile] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const now = new Date()
      // Fetch expenses (selected range)
      let expensesData
      if (timeRange === 'current') {
        const startDate = startOfMonth(now)
        ;({ data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .gte('expense_date', format(startDate, 'yyyy-MM-dd'))
          .lte('expense_date', format(now, 'yyyy-MM-dd'))
          .order('expense_date', { ascending: true }))
      } else {
        ;({ data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: true }))
      }

      // Fetch all expenses (for global stats like 直近6ヶ月折れ線)
      const { data: allExpensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
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
      setAllExpenses(allExpensesData || [])
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, timeRange])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, timeRange, fetchData])

  // SP判定（月間隔を詰めるために使用）
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches)
    }
    handler(mql)
    if ('addEventListener' in mql) {
      mql.addEventListener('change', handler)
      return () => mql.removeEventListener('change', handler)
    } else {
      // Safari 古い版対応: MediaQueryList#addListener の型が古い環境向け
      // @ts-expect-error legacy Safari addListener support
      mql.addListener(handler)
      return () => {
        // @ts-expect-error legacy Safari removeListener support
        mql.removeListener(handler)
      }
    }
  }, [])

  // Calculate monthly data
  const getMonthlyData = (): MonthlyData[] => {
    const months: MonthlyData[] = []
    const now = new Date()
    
    if (timeRange === 'current') {
      // 今月のみの場合
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

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
        month: format(now, 'MM月', { locale: ja }),
        expenses: totalExpenses,
        budget: budget,
      })
    } else {
      // 全期間の場合: 最初の支出月から現在まで
      if (expenses.length === 0) return months
      const firstDate = new Date(expenses[0].expense_date)
      const firstMonthStart = startOfMonth(firstDate)
      // 差分月数を算出
      const monthsCount = Math.max(
        1,
        (now.getFullYear() - firstMonthStart.getFullYear()) * 12 + (now.getMonth() - firstMonthStart.getMonth()) + 1
      )

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

  // 開始日（目標開始日 or 最初の支出月）から今日までの各月の使用率（その月の支出 / 月予算）
  const getUsageSinceStartData = () => {
    const now = new Date()
    const goal = savingsGoals[0]

    const firstDate = allExpenses.length > 0 ? new Date(allExpenses[0].expense_date) : now
    const startDate = goal?.start_date ? new Date(goal.start_date) : firstDate
    const startMonth = startOfMonth(startDate)

    const monthsCount = Math.max(
      1,
      (now.getFullYear() - startMonth.getFullYear()) * 12 + (now.getMonth() - startMonth.getMonth()) + 1
    )

    const monthlyIncome = userSettings?.monthly_income || 0
    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const monthlyNeededForGoal = goal
      ? Math.ceil(
          goal.target_amount /
            Math.max(
              1,
              Math.ceil(
                (new Date(goal.target_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )
            )
        )
      : 0
    const monthlyBudget = monthlyIncome - totalFixed - monthlyNeededForGoal

    const labels: string[] = []
    const rates: number[] = []

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const monthExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      })
      const monthSum = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      const usageRate = monthlyBudget > 0 ? (monthSum / monthlyBudget) * 100 : 0
      labels.push(format(monthDate, 'MM月', { locale: ja }))
      rates.push(Math.max(0, usageRate))
    }

    return { labels, rates }
  }

  const usageSinceStart = getUsageSinceStartData()

  // 月次の貯蓄額シリーズ（開始日〜今日、全期間データ使用。マイナスもあり）
  const getMonthlySavingsSeries = () => {
    const now = new Date()
    // 全期間の最初の支出月から
    const firstDate = allExpenses.length > 0 ? new Date(allExpenses[0].expense_date) : now
    const startMonth = startOfMonth(firstDate)
    const monthsCount = Math.max(
      1,
      (now.getFullYear() - startMonth.getFullYear()) * 12 + (now.getMonth() - startMonth.getMonth()) + 1
    )

    const monthlyIncome = userSettings?.monthly_income || 0
    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const goal = savingsGoals[0]
    const monthlyNeededForGoal = goal
      ? Math.ceil(
          goal.target_amount /
            Math.max(
              1,
              Math.ceil(
                (new Date(goal.target_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )
            )
        )
      : 0
    const monthlyBudget = monthlyIncome - totalFixed - monthlyNeededForGoal // 月別支出推移の予算と一致

    const labels: string[] = []
    const values: number[] = []

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const monthExpensesSum = allExpenses
        .filter(e => {
          const d = new Date(e.expense_date)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((s, e) => s + e.amount, 0)

      // 月の貯蓄額 = 予算 − その月の実支出（マイナスあり）
      const savings = monthlyBudget - monthExpensesSum
      labels.push(format(monthDate, 'MM月', { locale: ja }))
      values.push(savings)
    }

    // スケールは ±monthlyBudget を上下限に（0や負のケースも考慮）
    const max = Math.max(0, monthlyBudget)
    const min = -max
    return { labels, values, min, max, monthlyBudget }
  }
 
  const monthlyData = getMonthlyData()
  const categoryData = getCategoryData()
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  
  // 貯蓄目標進捗（全期間固定・余剰ベース: 収入 − 固定費 − 変動支出）
  const getSavingsProgressData = () => {
    const goal = savingsGoals[0]
    if (!goal) return null

    const now = new Date()

    // 進捗の起点: 目標開始日があればそれを、なければ全支出の最初の月、さらに無ければ今月
    const fallbackStart = allExpenses.length > 0 ? new Date(allExpenses[0].expense_date) : now
    const start = goal.start_date ? new Date(goal.start_date) : fallbackStart
    const startMonth = startOfMonth(start)

    // 全区間の月数（開始月〜今月まで）
    const monthsCount = Math.max(
      1,
      (now.getFullYear() - startMonth.getFullYear()) * 12 + (now.getMonth() - startMonth.getMonth()) + 1
    )

    const monthlyIncome = userSettings?.monthly_income || 0
    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // 実績: 全期間（allExpenses）の各月ごとの余剰を積み上げ
    let accumulatedActual = 0
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const monthVariable = allExpenses
        .filter(e => {
          const d = new Date(e.expense_date)
          return d >= monthStart && d <= monthEnd
        })
        .reduce((s, e) => s + e.amount, 0)

      const surplus = Math.max(0, monthlyIncome - totalFixed - monthVariable)
      accumulatedActual += surplus
    }

    const target = goal.target_amount || 0

    // 理想ペース: 開始日〜目標日で線形。今日時点の到達期待額
    const targetDate = new Date(goal.target_date)
    const totalMs = Math.max(0, targetDate.getTime() - start.getTime())
    const elapsedMs = Math.max(0, Math.min(now.getTime(), targetDate.getTime()) - start.getTime())
    const idealAccumulated = totalMs > 0 ? Math.min(target, (elapsedMs / totalMs) * target) : 0

    const percentActual = target > 0 ? Math.min(100, (accumulatedActual / target) * 100) : 0
    const percentIdeal = target > 0 ? Math.min(100, (idealAccumulated / target) * 100) : 0
    const remaining = Math.max(0, target - accumulatedActual)
    const aheadAmount = accumulatedActual - idealAccumulated

    return {
      accumulated: accumulatedActual,
      target,
      percent: percentActual,
      remaining,
      title: goal.title,
      targetDate: goal.target_date,
      startDate: goal.start_date || startMonth.toISOString(),
      idealAccumulated,
      percentIdeal,
      aheadAmount,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold glass-text-strong mb-2">分析</h1>
          <p className="glass-text">支出パターンと貯金の進捗を詳しく分析しましょう</p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'current' | 'all')}
            className="glass-input px-4 py-2"
          >
            <option value="current">今月のみ</option>
            <option value="all">全期間</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {/* Savings Pace (left) + Summary Cards (right) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Left: single bar (ideal vs actual) amounts only */}
        <div className="glass-card p-4 md:p-6 glass-shine md:col-span-4">
          <h3 className="text-base md:text-lg font-bold glass-text-strong mb-3">月毎の貯蓄額（開始〜今日）</h3>
          {(() => {
            const series = getMonthlySavingsSeries()
            const width = 640
            const height = 200
            const paddingLeft = 40
            const paddingRight = 16
            const paddingTop = 28
            const paddingBottom = 36
            const innerWidth = width - paddingLeft - paddingRight
            const innerHeight = height - paddingTop - paddingBottom
 
            const n = Math.max(1, series.values.length)
            const barGap = 6
            const barWidth = Math.max(2, ((innerWidth - barGap * (n - 1)) / n) * 0.4)
 
            const min = Math.min(0, series.min)
            const max = Math.max(0, series.max)
            const range = max - min || 1
            const yAt = (v: number) => paddingTop + innerHeight * (1 - (v - min) / range)
            const zeroY = yAt(0)
 
            // Mobile: show simple list (no SVG)
            if (isMobile) {
              const startIndex = Math.max(0, series.values.length - 6)
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="glass-text">月予算: ¥{(series.monthlyBudget || 0).toLocaleString()}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-emerald-300 text-xs">貯蓄（+）</span>
                      <span className="text-red-300 text-xs">超過（−）</span>
                    </div>
                  </div>
                  {series.labels.slice(startIndex).map((label, idx) => {
                    const v = series.values[startIndex + idx]
                    const positive = v >= 0
                    return (
                      <div key={label} className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 border border-white/10">
                        <span className="text-xs glass-text">{label}</span>
                        <span className={`text-sm font-semibold ${positive ? 'text-emerald-300' : 'text-red-300'}`}>¥{Math.round(v).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div className="relative w-full overflow-x-auto">
                {/* Top-right budget and legend */}
                <div className="absolute top-0 right-0 flex items-center space-x-4 text-xs md:text-sm bg-black/20 border border-white/10 rounded-md px-2 py-1">
                  <span className="glass-text">月予算: ¥{(series.monthlyBudget || 0).toLocaleString()}</span>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg,#34d399,#059669)' }} />
                      <span className="glass-text">貯蓄（+）</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(180deg,#f87171,#b91c1c)' }} />
                      <span className="glass-text">超過（−）</span>
                    </div>
                  </div>
                </div>
 
                <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${isMobile ? 'min-w-[360px]' : 'min-w-[600px]'}`}>
                  {/* axes */}
                  <line x1={paddingLeft} y1={zeroY} x2={width - paddingRight} y2={zeroY} stroke="#ffffff44" strokeWidth={1} />
                  {/* bars */}
                  {series.values.map((v, i) => {
                    const x = paddingLeft + i * (barWidth + barGap)
                    const y = v >= 0 ? yAt(v) : zeroY
                    const h = Math.max(1, Math.abs(yAt(v) - zeroY))
                    const fill = v >= 0 ? 'url(#posGrad)' : 'url(#negGrad)'
                    const labelYPos = Math.max(paddingTop + 10, y - 8)
                    const labelYNeg = Math.min(height - paddingBottom - 6, y + h + 12)
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={barWidth} height={h} fill={fill} rx={3} />
                        {/* label */}
                        <text x={x + barWidth / 2} y={v >= 0 ? labelYPos : labelYNeg} textAnchor="middle" fontSize={11} fill="#ffffffdd">
                          ¥{Math.round(v).toLocaleString()}
                        </text>
                        {/* x label */}
                        <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#ffffffbb">{series.labels[i]}</text>
                      </g>
                    )
                  })}
                  {/* gradients */}
                  <defs>
                    <linearGradient id="posGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="negGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            )
          })()}
        </div>

        {/* Right: original summary cards grid */}
        <div className="grid grid-cols-1 gap-2 md:col-span-1">
          <div className="glass-card p-4 md:p-6 glass-shine">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2 md:space-x-0">
                <div className="p-2 md:p-3 bg-gradient-to-br from-gray-500/30 to-gray-600/30 backdrop-blur-sm border border-gray-400/30 rounded-lg md:rounded-xl shadow-glass-glow">
                  <BarChart3 className="w-4 h-4 md:w-6 md:h-6 glass-icon" />
                </div>
                <div className="md:hidden">
                  <p className="text-xs font-medium glass-text">総支出</p>
                  <p className="text-lg font-bold glass-text-strong">¥{totalExpenses.toLocaleString()}</p>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium glass-text mb-1">総支出</p>
                <p className="text-2xl font-bold glass-text-strong">¥{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 md:p-6 glass-shine">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2 md:space-x-0">
                <div className="p-2 md:p-3 bg-gradient-to-br from-gray-700/30 to-gray-800/30 backdrop-blur-sm border border-gray-600/30 rounded-lg md:rounded-xl shadow-glass-glow">
                  <Target className="w-4 h-4 md:w-6 md:h-6 glass-icon" />
                </div>
                <div className="md:hidden">
                  <p className="text-xs font-medium glass-text">支出記録数</p>
                  <p className="text-lg font-bold glass-text-strong">{expenses.length}件</p>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium glass-text mb-1">支出記録数</p>
                <p className="text-2xl font-bold glass-text-strong">{expenses.length}件</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend + Achievement (side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500/30 to-blue-600/30 backdrop-blur-sm border border-blue-400/30 rounded-xl shadow-glass-glow">
              <BarChart3 className="w-6 h-6 glass-icon" />
            </div>
            <h2 className="text-xl font-bold glass-text-strong">月別支出推移</h2>
          </div>

          <div className="space-y-4">
            {timeRange === 'current' ? (
              // 今月のみの場合は特別な表示
              monthlyData.map((data, index) => {
                const percentage = data.budget > 0 ? (data.expenses / data.budget) * 100 : 0
                const isOverBudget = percentage > 100

                return (
                  <div key={index} className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg text-start text-white font-semibold mb-2">{data.month}の支出分析</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div className="glass-card p-4">
                          <p className="text-sm glass-text font-medium">今月の支出</p>
                          <p className="text-2xl font-bold glass-text-strong">¥{data.expenses.toLocaleString()}</p>
                        </div>
                        <div className="glass-card p-4">
                          <p className="text-sm glass-text font-medium">予算</p>
                          <p className="text-2xl font-bold glass-text-strong">¥{data.budget.toLocaleString()}</p>
                        </div>
                        <div className={`glass-card p-4 ${isOverBudget ? 'border border-red-400/30' : ''}`}>
                          <p className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'glass-text'}`}>使用率</p>
                          <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-400' : 'glass-text-strong'}`}>
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 glass-card p-4">
                      <span className="font-medium glass-text">予算に対する支出</span>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center justify-between w-full space-x-4">
                          <span className="text-sm glass-text">予算: ¥{data.budget.toLocaleString()}</span>
                          <span className={`font-semibold ${isOverBudget ? 'text-red-400' : 'glass-text-strong'}`}>¥{data.expenses.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-white/20 border border-white/20 rounded-full h-4 backdrop-blur-sm">
                          <div
                            className={`h-4 rounded-full transition-all duration-500 ${
                              isOverBudget 
                                ? 'bg-gradient-to-r from-red-400 to-red-600' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-600'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        {isOverBudget && (
                          <div className="absolute top-[3px] right-0 -mt-1 -mr-1">
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex justify_between text-sm glass-text">
                        <span>0%</span>
                        <span className={isOverBudget ? 'text-red-400 font-medium' : 'glass-text-strong'}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              // 複数月の場合は従来の表示
              monthlyData.map((data, index) => {
                const percentage = data.budget > 0 ? (data.expenses / data.budget) * 100 : 0
                const isOverBudget = percentage > 100

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{data.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-white">
                          予算: ¥{data.budget.toLocaleString()}
                        </span>
                        <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-white'}`}>
                          ¥{data.expenses.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-white rounded-full h-3">
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
                        <div className="absolute top-[2px] right-0 -mt-1 -mr-1">
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">!</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-white">
                      <span>0%</span>
                      <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-white'}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Achievement Rate (Last 6 Months) Line Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-sm border border-gray-500/30 rounded-xl shadow-glass-glow">
              <BarChart3 className="w-6 h-6 glass-icon" />
            </div>
            <h2 className="text-xl font-bold glass-text-strong">予算使用率推移</h2>
          </div>

          {(() => {
            const width = 600
            const height = 220
            const paddingLeft = 40
            const paddingRight = 16
            const paddingTop = 16
            const paddingBottom = 40
            const innerWidth = width - paddingLeft - paddingRight
            const innerHeight = height - paddingTop - paddingBottom
 
            // スケール: 最大値に応じて縦幅を動的確保（最低でも100%が入る）
            const maxRate = Math.max(100, ...usageSinceStart.rates)
            const tickStep = 50
            const tickMax = Math.ceil(maxRate / tickStep) * tickStep
            // 月間隔圧縮（SPのみ間隔を狭める）。見た目サイズはそのままに中央寄せで圧縮。
            const numPoints = Math.max(1, usageSinceStart.rates.length - 1)
            const compression = isMobile ? 0.7 : 1
            const compressedWidth = innerWidth * compression
            const xStart = paddingLeft + (innerWidth - compressedWidth) / 2
            const xAt = (idx: number) => xStart + (compressedWidth * idx) / numPoints
            const yAt = (rate: number) => paddingTop + innerHeight * (1 - rate / maxRate)
 
            type Pt = { x: number; y: number; rate: number }
            const pts: Pt[] = usageSinceStart.rates.map((rate, idx) => ({
              x: xAt(idx),
              y: yAt(rate),
              rate,
            }))
 
            // Mobile: simpler list (no SVG)
            if (isMobile) {
              const startIndex = Math.max(0, usageSinceStart.labels.length - 6)
              return (
                <div className="space-y-2">
                  {usageSinceStart.labels.slice(startIndex).map((label, idx) => {
                    const rate = usageSinceStart.rates[startIndex + idx]
                    const over = rate > 100
                    return (
                      <div key={label} className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 border border-white/10">
                        <span className="text-xs glass-text">{label}</span>
                        <span className={`text-sm font-semibold ${over ? 'text-red-300' : 'text-blue-300'}`}>{rate.toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px]">
                  {/* Axes */}
                  <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#ffffff55" strokeWidth={1} />
                  <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#ffffff55" strokeWidth={1} />
 
                  {/* Grid & labels (dynamic up to tickMax) */}
                  {Array.from({ length: Math.floor(tickMax / tickStep) + 1 }, (_, i) => i * tickStep).map((tick) => {
                    const y = paddingTop + innerHeight * (1 - tick / maxRate)
                    return (
                      <g key={tick}>
                        <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#ffffff22" strokeWidth={1} />
                        <text x={8} y={y + 4} fontSize={12} fill="#ffffffaa">{tick}%</text>
                      </g>
                    )
                  })}
 
                  {/* 100% reference line */}
                  <line x1={paddingLeft} y1={paddingTop + innerHeight * (1 - 100 / maxRate)} x2={width - paddingRight} y2={paddingTop + innerHeight * (1 - 100 / maxRate)} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
 
                  {/* Line with threshold-aware coloring (split at 100%) */}
                  {pts.slice(0, -1).map((p1, i) => {
                    const p2 = pts[i + 1]
                    const r1 = p1.rate
                    const r2 = p2.rate
                    const over1 = r1 > 100
                    const over2 = r2 > 100
 
                     // 交差判定（100%ライン）
                    if ((r1 - 100) * (r2 - 100) < 0) {
                       // tで補間点（100%に相当）
                      const t = (100 - r1) / (r2 - r1)
                      const xm = p1.x + (p2.x - p1.x) * t
                      const ym = yAt(100)
                      // 低い側→100%までは青、高い側→100%からは赤
                      return (
                        <g key={i}>
                          <line x1={p1.x} y1={p1.y} x2={xm} y2={ym} stroke={over1 ? '#f87171' : '#60a5fa'} strokeWidth={2.5} />
                          <line x1={xm} y1={ym} x2={p2.x} y2={p2.y} stroke={over2 ? '#f87171' : '#60a5fa'} strokeWidth={2.5} />
                        </g>
                      )
                    }
 
                    return (
                      <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={over1 || over2 ? '#f87171' : '#60a5fa'} strokeWidth={2.5} />
                    )
                  })}
 
                  {/* Dots */}
                  {usageSinceStart.rates.map((rate, idx) => {
                    const x = xAt(idx)
                    const y = yAt(rate)
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r={4} fill={rate > 100 ? '#fca5a5' : '#93c5fd'} stroke={rate > 100 ? '#dc2626' : '#2563eb'} strokeWidth={1} />
                      </g>
                    )
                  })}
 
                  {/* X labels */}
                  {usageSinceStart.labels.map((label, idx) => {
                    const x = paddingLeft + (innerWidth * idx) / Math.max(1, usageSinceStart.labels.length - 1)
                    return (
                      <text key={idx} x={x} y={height - paddingBottom + 20} textAnchor="middle" fontSize={12} fill="#ffffffdd">{label}</text>
                    )
                  })}
                </svg>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Savings Goal Progress */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-sm border border-gray-500/30 rounded-xl shadow-glass-glow">
            <Target className="w-6 h-6 glass-icon" />
          </div>
          <h2 className="text-xl font-bold glass-text-strong">貯蓄目標の進捗</h2>
        </div>

        {getSavingsProgressData() ? (
          (() => {
            const sp = getSavingsProgressData()!
            return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
              <div>
                <p className="glass-text text-sm">目標</p>
                <p className="text-2xl font-bold text-white">{sp.title || '未設定'}</p>
              </div>
              <div className="text-right">
                <p className="glass-text text-sm">目標金額</p>
                <p className="text-2xl font-bold text-white">¥{sp.target.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="glass-text text-sm">今日の理想到達額（ペース）</span>
                <span className="font-semibold text-blue-300">¥{Math.floor(sp.idealAccumulated).toLocaleString()}</span>
              </div>
              <div className="relative">
                <div className="w-full bg-white/10 border border-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                    style={{ width: `${sp.percentIdeal}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="glass-text text-sm">実績（全期間・余剰の累計）</span>
                <span className="glass-text-strong font-semibold">¥{Math.floor(sp.accumulated).toLocaleString()}</span>
              </div>
              <div className="relative">
                <div className="w-full bg-white/20 border border-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-green-400 to-green-600`}
                    style={{ width: `${sp.percent}%` }}
                  />
                </div>
                {sp.percent >= 100 && (
                  <div className="absolute -top-1 right-0 -mr-1">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className={`${sp.aheadAmount >= 0 ? 'text-green-300' : 'text-red-300'} text-right font-medium`}>
                  {sp.aheadAmount >= 0 ? '先行' : '遅れ'} ¥{Math.abs(Math.floor(sp.aheadAmount)).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="glass-card p-3">
                <p className="glass-text text-xs">残り金額</p>
                <p className="text-lg font-semibold text-white">¥{Math.ceil(sp.remaining).toLocaleString()}</p>
              </div>
              <div className="glass-card p-3">
                <p className="glass-text text-xs">目標日</p>
                <p className="text-lg font-semibold text-white">{format(new Date(sp.targetDate), 'yyyy/MM/dd')}</p>
              </div>
              <div className="glass-card p-3">
                <p className="glass-text text-xs">分析期間</p>
                <p className="text-lg font-semibold text-white">開始 {sp.startDate ? format(new Date(sp.startDate), 'yyyy/MM/dd') : '—'} 〜 今日</p>
              </div>
            </div>
          </div>)
          })()
        ) : (
          <div className="text-center glass-text">貯蓄目標が未設定です。設定ページで目標を追加しましょう。</div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-gray-600/30 to-gray-700/30 backdrop-blur-sm border border-gray-500/30 rounded-xl shadow-glass-glow">
            <PieChart className="w-6 h-6 glass-icon" />
          </div>
          <h2 className="text-xl font-bold glass-text-strong">カテゴリ別支出</h2>
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
                      fillOpacity={0.5}
                      stroke={category.color}
                      strokeWidth={1.5}
                      className="hover:opacity-80 transition-opacity"
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    ¥{totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-white">総支出</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}