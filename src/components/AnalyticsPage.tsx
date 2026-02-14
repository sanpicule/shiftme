import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BarChart3, PieChart, Target } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';
import { SkeletonCard, SkeletonText } from './SkeletonCard';
import { useData } from '../contexts/DataContext';

interface MonthlyData {
  month: string;
  expenses: number;
  budget: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export function AnalyticsPage() {
  const { userSettings } = useUserSettings();
  const { allExpenses, fixedExpenses, savingsGoals, previousMonthCarryover, loading } = useData();

  const [timeRange, setTimeRange] = useState<'current' | 'all'>('current');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'list'>('category');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // 'current' timeRange用のexpensesをフィルタリング
  const expenses =
    timeRange === 'current'
      ? allExpenses.filter(e => {
          const d = new Date(e.expense_date);
          const monthStart = startOfMonth(new Date());
          return d >= monthStart;
        })
      : allExpenses;

  // SP判定（月間隔を詰めるために使用）
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    };
    handler(mql);
    if ('addEventListener' in mql) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      // Safari 古い版対応: MediaQueryList#addListener の型が古い環境向け
      // @ts-expect-error legacy Safari addListener support
      mql.addListener(handler);
      return () => {
        // @ts-expect-error legacy Safari removeListener support
        mql.removeListener(handler);
      };
    }
  }, []);

  // Calculate monthly data
  const getMonthlyData = (): MonthlyData[] => {
    const months: MonthlyData[] = [];
    const now = new Date();

    const calculateMonthlyBudget = () => {
      const monthlyIncome = userSettings?.monthly_income || 0;
      const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const savingsGoal = savingsGoals[0];
      let monthlyNeededForGoal = 0;
      if (savingsGoal) {
        const targetDate = new Date(savingsGoal.target_date);
        const creationDate = new Date(savingsGoal.created_at);
        const monthsAtCreation = Math.max(
          1,
          Math.ceil((targetDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
        );
        monthlyNeededForGoal = Math.ceil(savingsGoal.target_amount / monthsAtCreation);
      }

      const income = monthlyIncome;

      const budget = income - totalFixed - monthlyNeededForGoal;
      return budget;
    };

    if (timeRange === 'current') {
      // 今月のみの場合
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budget = calculateMonthlyBudget();

      months.push({
        month: format(now, 'MM月', { locale: ja }),
        expenses: totalExpenses,
        budget: budget,
      });
    } else {
      // 全期間の場合: 最初の支出月から現在まで
      if (expenses.length === 0) return months;
      const firstDate = new Date(expenses[0].expense_date);
      const firstMonthStart = startOfMonth(firstDate);
      // 差分月数を算出
      const monthsCount = Math.max(
        1,
        (now.getFullYear() - firstMonthStart.getFullYear()) * 12 +
          (now.getMonth() - firstMonthStart.getMonth()) +
          1,
      );

      for (let i = monthsCount - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        });

        const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const budget = calculateMonthlyBudget();

        months.push({
          month: format(monthDate, 'MM月', { locale: ja }),
          expenses: totalExpenses,
          budget: budget,
        });
      }
    }

    return months;
  };

  // Calculate category data
  const getCategoryData = (): CategoryData[] => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const colors = [
      '#3B82F6',
      '#8B5CF6',
      '#EF4444',
      '#F59E0B',
      '#10B981',
      '#F97316',
      '#6366F1',
      '#EC4899',
    ];

    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  };

  // 月次の貯蓄額シリーズ（開始日〜今日、全期間データ使用。マイナスもあり）
  const getMonthlySavingsSeries = () => {
    const now = new Date();
    // 全期間の最初の支出月から
    const firstDate = allExpenses.length > 0 ? new Date(allExpenses[0].expense_date) : now;
    const startMonth = startOfMonth(firstDate);
    const monthsCount = Math.max(
      1,
      (now.getFullYear() - startMonth.getFullYear()) * 12 +
        (now.getMonth() - startMonth.getMonth()) +
        1,
    );

    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const goal = savingsGoals[0];
    let monthlyNeededForGoal = 0;
    if (goal) {
      const targetDate = new Date(goal.target_date);
      const creationDate = new Date(goal.created_at);
      const monthsAtCreation = Math.max(
        1,
        Math.ceil((targetDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
      );
      monthlyNeededForGoal = Math.ceil(goal.target_amount / monthsAtCreation);
    }

    const labels: string[] = [];
    const values: number[] = [];
    let monthlyBudget = 0;

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // 月別の予算を計算（ボーナス対応）
      let monthlyIncome = userSettings?.monthly_income || 0;
      if (userSettings?.bonus_months) {
        const bonusMonthsArray = userSettings.bonus_months.split(',').map(m => parseInt(m.trim()));
        const currentMonth = monthDate.getMonth() + 1;
        if (bonusMonthsArray.includes(currentMonth)) {
          monthlyIncome += userSettings?.bonus_amount || 0;
        }
      }
      monthlyBudget = monthlyIncome - totalFixed - monthlyNeededForGoal;

      const monthExpensesSum = allExpenses
        .filter(e => {
          const d = new Date(e.expense_date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, e) => s + e.amount, 0);

      // 月の貯蓄額 = 予算 − その月の実支出（マイナスあり）
      const savings = monthlyBudget - monthExpensesSum;
      labels.push(format(monthDate, 'MM月', { locale: ja }));
      values.push(savings);
    }

    // スケールは ±monthlyBudget を上下限に（0や負のケースも考慮）
    const max = Math.max(0, monthlyBudget);
    const min = -max;
    return { labels, values, min, max, monthlyBudget };
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 貯蓄目標進捗（全期間固定・余剰ベース: 収入 − 固定費 − 変動支出）
  const getSavingsProgressData = () => {
    const goal = savingsGoals[0];
    if (!goal) return null;

    const now = new Date();

    // 進捗の起点: 目標開始日があればそれを、なければ全支出の最初の月、さらに無ければ今月
    const fallbackStart = allExpenses.length > 0 ? new Date(allExpenses[0].expense_date) : now;
    const start = goal.start_date ? new Date(goal.start_date) : fallbackStart;
    const startMonth = startOfMonth(start);

    // 全区間の月数（開始月〜今月まで）
    const monthsCount = Math.max(
      1,
      (now.getFullYear() - startMonth.getFullYear()) * 12 +
        (now.getMonth() - startMonth.getMonth()) +
        1,
    );

    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // 実績: 全期間（allExpenses）の各月ごとの余剰を積み上げ
    let accumulatedActual = 0;
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // 月別の収入を計算（ボーナス対応）
      let monthlyIncome = userSettings?.monthly_income || 0;
      if (userSettings?.bonus_months) {
        const bonusMonthsArray = userSettings.bonus_months.split(',').map(m => parseInt(m.trim()));
        const currentMonth = monthDate.getMonth() + 1;
        if (bonusMonthsArray.includes(currentMonth)) {
          monthlyIncome += userSettings?.bonus_amount || 0;
        }
      }

      const monthVariable = allExpenses
        .filter(e => {
          const d = new Date(e.expense_date);
          return d >= monthStart && d <= monthEnd;
        })
        .reduce((s, e) => s + e.amount, 0);

      const surplus = Math.max(0, monthlyIncome - totalFixed - monthVariable);
      accumulatedActual += surplus;
    }

    const target = goal.target_amount || 0;

    // 理想ペース: 開始日〜目標日で線形。今日時点の到達期待額
    const targetDate = new Date(goal.target_date);
    const totalMs = Math.max(0, targetDate.getTime() - start.getTime());
    const elapsedMs = Math.max(0, Math.min(now.getTime(), targetDate.getTime()) - start.getTime());
    const idealAccumulated = totalMs > 0 ? Math.min(target, (elapsedMs / totalMs) * target) : 0;

    const percentActual = target > 0 ? Math.min(100, (accumulatedActual / target) * 100) : 0;
    const percentIdeal = target > 0 ? Math.min(100, (idealAccumulated / target) * 100) : 0;
    const remaining = Math.max(0, target - accumulatedActual);
    const aheadAmount = accumulatedActual - idealAccumulated;

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
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3">
            <SkeletonText className="h-8" width="w-40" />
            <SkeletonText className="h-4" width="w-56" />
          </div>
          <div className="h-10 w-40 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard>
            <div className="p-6 space-y-4">
              <SkeletonText className="h-6" width="w-32" />
              <div className="h-48 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
              <div className="space-y-2">
                <SkeletonText width="w-3/4" />
                <SkeletonText width="w-2/3" />
                <SkeletonText width="w-1/2" />
              </div>
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <div className="p-6 space-y-4">
              <SkeletonText className="h-6" width="w-28" />
              <div className="h-48 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
              <div className="space-y-2">
                <SkeletonText width="w-2/3" />
                <SkeletonText width="w-1/2" />
              </div>
            </div>
          </SkeletonCard>
        </div>
        <SkeletonCard>
          <div className="p-6 space-y-4">
            <SkeletonText className="h-6" width="w-36" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`skeleton-summary-${index}`}
                  className="h-16 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </SkeletonCard>
      </div>
    );
  }

  // 今月のみ選択時の処理
  if (timeRange === 'current') {
    const hasExpenses = expenses.length > 0;

    // 今月の予算情報を計算
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });

    // 今月の収入（マイナス値の支出）の絶対値を計算
    const incomeThisMonth = monthExpenses
      .filter(expense => expense.amount < 0)
      .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

    // 今月の支出（プラス値のみ）を計算
    const actualExpensesThisMonth = monthExpenses
      .filter(expense => expense.amount > 0)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const totalFixed = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyIncome = userSettings?.monthly_income || 0;

    const savingsGoal = savingsGoals[0];
    let monthlyNeededForGoal = 0;
    if (savingsGoal) {
      const targetDate = new Date(savingsGoal.target_date);
      const creationDate = new Date(savingsGoal.created_at);
      const monthsAtCreation = Math.max(
        1,
        Math.ceil((targetDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
      );
      monthlyNeededForGoal = Math.ceil(savingsGoal.target_amount / monthsAtCreation);
    }

    // 予算 = 収入 - 固定費 - 貯蓄目標 + 今月の収入（マイナス値の絶対値）
    const fixedBudget = monthlyIncome - totalFixed - monthlyNeededForGoal + incomeThisMonth;
    const budget = fixedBudget + previousMonthCarryover;
    const remaining = budget - actualExpensesThisMonth;
    const budgetPercentage = fixedBudget > 0 ? (actualExpensesThisMonth / fixedBudget) * 100 : 0;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold glass-text-strong mb-2">今月の支出</h1>
            <p className="glass-text text-sm sm:text-base">
              {format(new Date(), 'yyyy年MM月', { locale: ja })}の支出記録
            </p>
          </div>
          <div>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as 'current' | 'all')}
              className="glass-input px-4 py-2 w-full sm:w-auto"
            >
              <option value="current">今月のみ</option>
              <option value="all">全期間</option>
            </select>
          </div>
        </div>

        {!hasExpenses && budget <= 0 ? (
          // 記録がない場合
          <div className="glass-card p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-center">
                <BarChart3 className="w-16 h-16 sm:w-20 sm:h-20 glass-icon" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold glass-text-strong">
                表示するデータがありません
              </h3>
              <p className="glass-text text-sm sm:text-base">
                ダッシュボードより支出を追加してください。
              </p>
            </div>
          </div>
        ) : (
          // 記録がある場合
          <>
            {/* 予算概要カード */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="px-2 glass-shine">
                <p className="glass-text font-semibold text-sm sm:text-base mb-2">今月の予算</p>
                <p className="text-2xl sm:text-4xl font-bold glass-text-strong">
                  ¥{budget.toLocaleString()}
                </p>
              </div>

              <div className="px-2 glass-shine">
                <div className="flex items-center gap-4">
                  <p className="glass-text font-semibold text-sm sm:text-base">実支出</p>
                  <p className="glass-text text-xs sm:text-sm">- {monthExpenses.length}件の記録</p>
                </div>
                <p className="text-2xl sm:text-4xl font-bold glass-text-strong">
                  ¥{actualExpensesThisMonth.toLocaleString()}
                </p>
              </div>

              <div className="px-2 glass-shine">
                <p className="glass-text font-semibold text-sm sm:text-base mb-2">残り</p>
                <p
                  className={`text-2xl sm:text-4xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-400'}`}
                >
                  ¥{remaining.toLocaleString()}
                </p>
              </div>
            </div>

            {/* 予算使用率バー */}
            <div className="glass-card p-6 sm:p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold glass-text-strong">予算の使用率</h3>
                <span
                  className={`text-2xl font-bold ${budgetPercentage > 100 ? 'text-red-400' : budgetPercentage > 80 ? 'text-yellow-400' : 'text-blue-400'}`}
                >
                  {budgetPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-300 rounded-full h-4 border border-white/20">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      budgetPercentage > 100
                        ? 'bg-gradient-to-r from-red-400 to-red-600'
                        : budgetPercentage > 80
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                  />
                </div>
                {budgetPercentage > 100 && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 -mr-8">
                    <span className="text-red-400 font-semibold text-sm">超過</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs glass-text mt-3">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* カテゴリ別内訳/全記録表示 */}
            {(categoryData.length > 0 || expenses.length > 0) && (
              <div className="glass-card p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                  <div className="flex items-center space-x-3">
                    <PieChart className="w-6 h-6 sm:w-7 sm:h-7 glass-icon" />
                    <h2 className="text-lg sm:text-xl font-bold glass-text-strong">
                      {viewMode === 'category' ? 'カテゴリ別内訳' : '全記録'}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={viewMode}
                      onChange={e => setViewMode(e.target.value as 'category' | 'list')}
                      className="glass-input px-3 py-1.5 text-sm"
                    >
                      <option value="category">カテゴリ別</option>
                      <option value="list">全記録</option>
                    </select>
                    {viewMode === 'list' && (
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
                        className="glass-input px-3 py-1.5 text-sm"
                      >
                        <option value="date">日付順</option>
                        <option value="amount">金額順</option>
                      </select>
                    )}
                  </div>
                </div>

                {viewMode === 'category' ? (
                  <>
                    {/* カテゴリ別表示 */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* カテゴリリスト */}
                      <div className="flex-1 space-y-2">
                        {categoryData.map((category, index) => (
                          <div
                            key={index}
                            className="flex items-center sm:p-4 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl border border-white/10 transition-all"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium glass-text-strong text-sm sm:text-base truncate">
                                {category.category}
                              </span>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold glass-text-strong text-sm sm:text-base">
                                {category.amount > 0 ? '-' : ''}¥
                                {Math.abs(category.amount).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* デスクトップ用：円グラフ */}
                      <div className="hidden lg:flex items-center justify-center lg:w-80">
                        <div className="relative w-64 h-64">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {categoryData.length === 1 ? (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill={categoryData[0].color}
                                fillOpacity={0.5}
                                stroke={categoryData[0].color}
                                strokeWidth={1.5}
                                className="hover:opacity-80 transition-opacity"
                              />
                            ) : (
                              (() => {
                                const totalAmount = categoryData.reduce(
                                  (sum, cat) => sum + Math.abs(cat.amount),
                                  0,
                                );
                                let currentAngle = 0;
                                return categoryData.map((category, index) => {
                                  const percentage =
                                    totalAmount > 0
                                      ? (Math.abs(category.amount) / totalAmount) * 100
                                      : 0;
                                  const startAngle = currentAngle;
                                  const endAngle = startAngle + (percentage / 100) * 360;
                                  currentAngle = endAngle;
                                  const largeArcFlag = percentage > 50 ? 1 : 0;

                                  const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                                  const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                                  const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                                  const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

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
                                  );
                                });
                              })()
                            )}
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold glass-text-strong">
                                ¥
                                {categoryData
                                  .reduce((sum, cat) => sum + Math.abs(cat.amount), 0)
                                  .toLocaleString()}
                              </div>
                              <div className="text-sm glass-text">合計</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 全記録表示 */}
                    <div className="space-y-2">
                      {(() => {
                        const sortedExpenses = [...expenses].sort((a, b) => {
                          if (sortBy === 'date') {
                            return (
                              new Date(b.expense_date).getTime() -
                              new Date(a.expense_date).getTime()
                            );
                          } else {
                            return b.amount - a.amount;
                          }
                        });

                        return sortedExpenses.map(expense => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl border border-white/10 transition-all"
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium glass-text-strong text-sm sm:text-base truncate">
                                  {expense.category}
                                </span>
                                {expense.description && (
                                  <span className="text-xs glass-text truncate">
                                    - {expense.description}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs glass-text">
                                {format(new Date(expense.expense_date), 'yyyy年M月d日(E)', {
                                  locale: ja,
                                })}
                              </span>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold glass-text-strong text-sm sm:text-base">
                                {expense.amount > 0 ? '-' : ''}¥
                                {Math.abs(expense.amount).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    {expenses.length === 0 && (
                      <div className="text-center py-8 glass-text">記録がありません</div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // 全期間選択時の新しいPC向けレイアウト
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
            onChange={e => setTimeRange(e.target.value as 'current' | 'all')}
            className="glass-input px-4 py-2"
          >
            <option value="current">今月のみ</option>
            <option value="all">全期間</option>
          </select>
        </div>
      </div>

      {/* KPIサマリーカード */}
      {/* 詳細トレンドセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 貯蓄目標の進捗 */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-7 h-7 glass-icon" />
            <h2 className="text-xl font-bold glass-text-strong">貯蓄目標の進捗</h2>
          </div>
          {getSavingsProgressData() ? (
            (() => {
              const sp = getSavingsProgressData()!;
              return (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                    <div>
                      <p className="glass-text text-sm">目標</p>
                      <p className="text-2xl font-bold text-gray-800">{sp.title || '未設定'}</p>
                    </div>
                    <div className="text-right">
                      <p className="glass-text text-sm">目標金額</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ¥{sp.target.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="glass-text text-sm">今日の理想到達額（ペース）</span>
                      <span className="font-semibold text-blue-600">
                        ¥{Math.floor(sp.idealAccumulated).toLocaleString()}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-300 rounded-full h-3 backdrop-blur-sm">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                          style={{ width: `${sp.percentIdeal}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="glass-text text-sm">実績（全期間・余剰の累計）</span>
                      <span className="glass-text-strong font-semibold">
                        ¥{Math.floor(sp.accumulated).toLocaleString()}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-300 rounded-full h-3 backdrop-blur-sm">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-green-400 to-green-600`}
                          style={{ width: `${sp.percent}%` }}
                        />
                      </div>
                      {sp.percent >= 100 && (
                        <div className="absolute -top-[3px] right-0 -mr-1">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div
                        className={`${sp.aheadAmount >= 0 ? 'text-green-600' : 'text-red-600'} text-right font-medium`}
                      >
                        {sp.aheadAmount >= 0 ? '先行' : '遅れ'} ¥
                        {Math.abs(Math.floor(sp.aheadAmount)).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="glass-card p-3">
                      <p className="glass-text text-xs">残り金額</p>
                      <p className="text-lg font-semibold text-gray-800">
                        ¥{Math.ceil(sp.remaining).toLocaleString()}
                      </p>
                    </div>
                    <div className="glass-card p-3">
                      <p className="glass-text text-xs">目標日</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {format(new Date(sp.targetDate), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div className="glass-card p-3">
                      <p className="glass-text text-xs">分析期間</p>
                      <p className="text-lg font-semibold text-gray-800">
                        開始 {sp.startDate ? format(new Date(sp.startDate), 'yyyy/MM/dd') : '—'} 〜
                        今日
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center glass-text">貯蓄目標が未設定です。</div>
          )}
        </div>
        {/* 月別支出推移 */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-7 h-7 glass-icon" />
            <h2 className="text-xl font-bold glass-text-strong">月別支出推移</h2>
          </div>
          <div className="space-y-4">
            {monthlyData.map((data, index) => {
              const percentage = data.budget > 0 ? (data.expenses / data.budget) * 100 : 0;
              const isOverBudget = percentage > 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{data.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-800">
                        予算: ¥{data.budget.toLocaleString()}
                      </span>
                      <span
                        className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}
                      >
                        ¥{data.expenses.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-300 rounded-full h-3">
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
                          <span className="text-gray-800 text-xs">!</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-800">
                    <span>0%</span>
                    <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-800'}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-0 sm:glass-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="sm:glass-card sm:p-6 sm:glass-shine pb-3 sm:pb-0 border-b sm:border-b-0 border-white/10">
            <p className="text-sm font-bold glass-text mb-1">総支出</p>
            <p className="text-2xl font-semibold glass-text-strong">
              ¥{totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="sm:glass-card sm:p-6 sm:glass-shine pb-3 sm:pb-0 border-b sm:border-b-0 border-white/10">
            <p className="text-sm font-bold glass-text mb-1">支出記録数</p>
            <p className="text-2xl font-semibold glass-text-strong">{expenses.length}件</p>
          </div>
          <div className="sm:glass-card sm:p-6 sm:glass-shine pb-3 sm:pb-0 border-b sm:border-b-0 border-white/10">
            <p className="text-sm font-bold glass-text mb-1">平均月間支出</p>
            <p className="text-2xl font-semibold glass-text-strong">
              ¥
              {monthlyData.length > 0
                ? Math.round(
                    monthlyData.reduce((sum, d) => sum + d.expenses, 0) / monthlyData.length,
                  ).toLocaleString()
                : 0}
            </p>
          </div>
          <div className="sm:glass-card sm:p-6 sm:glass-shine">
            <p className="text-sm font-bold glass-text mb-1">目標達成率</p>
            <p className="text-2xl font-semibold glass-text-strong">
              {getSavingsProgressData()?.percent.toFixed(1) || '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* メイングラフセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 月毎の貯蓄額グラフ (左側) */}
        <div className="glass-card p-6 glass-shine lg:col-span-3">
          <h3 className="text-lg font-bold glass-text-strong mb-4">月毎の貯蓄額（開始〜今日）</h3>
          {(() => {
            const series = getMonthlySavingsSeries();
            if (!series || series.values.length === 0) {
              return <div className="text-center glass-text py-10">データがありません。</div>;
            }

            // Mobile: show simple list (no SVG)
            if (isMobile) {
              const startIndex = Math.max(0, series.values.length - 6);
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="glass-text">
                      月予算: ¥{(series.monthlyBudget || 0).toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-emerald-600 text-xs">貯蓄（+）</span>
                      <span className="text-red-600 text-xs">超過（−）</span>
                    </div>
                  </div>
                  {series.labels.slice(startIndex).map((label, idx) => {
                    const v = series.values[startIndex + idx];
                    const positive = v >= 0;
                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-white/5 border border-white/10"
                      >
                        <span className="text-xs glass-text">{label}</span>
                        <span
                          className={`text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          ¥{Math.round(v).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // PC: show interactive bar chart
            const maxValue = Math.max(...series.values.map(v => Math.abs(v)), 1);

            return (
              <div className="w-full">
                <div className="flex justify-end items-center space-x-4 text-xs mb-2">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="glass-text">貯蓄 (+)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="glass-text">超過 (-)</span>
                  </div>
                </div>

                <div className="relative h-64 w-full flex items-end justify-start flex-nowrap gap-4 px-4 pt-4 border-l border-b border-white/10 overflow-x-auto">
                  {/* 0 Axis Line */}
                  <div className="absolute top-1/2 left-0 w-full h-px bg-white/20 z-0"></div>
                  <div className="absolute top-1/2 left-[-2.5rem] text-xs glass-text">¥0</div>
                  <div className="absolute top-0 left-[-2.5rem] text-xs glass-text">
                    ¥{(Math.ceil(maxValue / 1000) * 1000).toLocaleString()}
                  </div>
                  <div className="absolute bottom-0 left-[-2.5rem] text-xs glass-text">
                    -¥{(Math.ceil(maxValue / 1000) * 1000).toLocaleString()}
                  </div>

                  {series.values.map((v, i) => {
                    const percentage = (v / maxValue) * 50; // 50% of height for positive, 50% for negative
                    const isPositive = v >= 0;

                    return (
                      <div
                        key={i}
                        className="group relative w-12 flex-shrink-0 flex flex-col items-center h-full"
                      >
                        {isPositive ? (
                          <div
                            className="absolute bottom-1/2 w-3/4 bg-emerald-500 rounded-t-md transition-all duration-300 ease-in-out group-hover:bg-emerald-400 group-hover:shadow-lg"
                            style={{ height: `${percentage}%` }}
                          />
                        ) : (
                          <div
                            className="absolute top-1/2 w-3/4 bg-red-500 rounded-b-md transition-all duration-300 ease-in-out group-hover:bg-red-400 group-hover:shadow-lg"
                            style={{ height: `${-percentage}%` }}
                          />
                        )}
                        <span className="absolute -bottom-5 text-xs glass-text">
                          {series.labels[i]}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 w-max px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <p className="font-bold">{series.labels[i]}</p>
                          <p>
                            貯蓄額:{' '}
                            <span
                              className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                              ¥{Math.round(v).toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* カテゴリ別支出 (右側) */}
        <div className="glass-card p-6 glass-shine lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <PieChart className="w-7 h-7 glass-icon" />
            <h2 className="text-lg font-bold glass-text-strong">カテゴリ別支出</h2>
          </div>
          <div className="space-y-3">
            {categoryData.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium glass-text-strong text-sm truncate">
                    {category.category}
                  </span>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold glass-text-strong text-sm">
                    ¥{category.amount.toLocaleString()}
                  </div>
                  <div className="text-xs glass-text">{category.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
