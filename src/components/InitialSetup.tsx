import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Target, CheckCircle, Sparkles } from 'lucide-react'
import { useUserSettings } from '../hooks/useUserSettings.tsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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

interface SetupForm {
  monthly_income: number
}

export function InitialSetup() {
  const { user } = useAuth()
  const { updateUserSettings } = useUserSettings()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseForm[]>([])
  const [savingsGoal] = useState<SavingsGoalForm>({
    title: '',
    description: '',
    target_amount: 0,
    target_date: '',
  })

  const { register: registerIncome, handleSubmit: handleIncomeSubmit } = useForm<SetupForm>()
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense } = useForm<FixedExpenseForm>()
  const { register: registerGoal, handleSubmit: handleGoalSubmit } = useForm<SavingsGoalForm>()

  const addFixedExpense = (data: FixedExpenseForm) => {
    // Convert amount to number to ensure proper calculation
    const expenseWithNumberAmount = {
      ...data,
      amount: Number(data.amount)
    }
    setFixedExpenses([...fixedExpenses, expenseWithNumberAmount])
    resetExpense()
  }

  const removeFixedExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index))
  }

  const handleIncomeNext = (data: SetupForm) => {
    setMonthlyIncome(Number(data.monthly_income))
    setStep(2)
  }

  const handleExpenseNext = () => {
    setStep(3)
  }

  const handleFinalSubmit = async (goalData: SavingsGoalForm) => {
    if (!user) return
    
    setLoading(true)
    try {
      // Save fixed expenses
      if (fixedExpenses.length > 0) {
        const expensesWithUserId = fixedExpenses.map(expense => ({
          ...expense,
          amount: Number(expense.amount),
          user_id: user.id,
        }))
        
        const { error: expensesError } = await supabase
          .from('fixed_expenses')
          .insert(expensesWithUserId)
        
        if (expensesError) throw expensesError
      }

      // Save savings goal
      const { error: goalError } = await supabase
        .from('savings_goals')
        .insert({
          ...goalData,
          target_amount: Number(goalData.target_amount),
          user_id: user.id,
        })
      
      if (goalError) throw goalError

      // Update user settings to mark setup as completed
      const { error: settingsError } = await updateUserSettings({
        monthly_income: monthlyIncome,
        setup_completed: true,
      })
      
      if (settingsError) throw settingsError

      // Show success message briefly, then force a page reload to trigger App.tsx re-evaluation
      setStep(4) // Show success step
      
      // Wait 2 seconds to show success message, then reload the page
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Error saving setup:', error)
      alert('設定の保存中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const monthlyNeededForGoal = savingsGoal.target_amount && savingsGoal.target_date
    ? Math.ceil(Number(savingsGoal.target_amount) / Math.max(1, Math.ceil((new Date(savingsGoal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))))
    : 0
  const availableAmount = monthlyIncome - totalFixedExpenses - monthlyNeededForGoal

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">初期設定</span>
            <span className="text-sm text-gray-500">{Math.min(step, 3)}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Monthly Income */}
        {step === 1 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">月収を教えてください</h2>
            <p className="text-gray-600 mb-6">毎月の収入を入力して、家計管理の基準を設定しましょう。</p>
            
            <form onSubmit={handleIncomeSubmit(handleIncomeNext)} className="space-y-6">
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
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1"
              >
                次へ
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Fixed Expenses */}
        {step === 2 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">固定支出を登録してください</h2>
            <p className="text-gray-600 mb-6">家賃、光熱費、保険料など、毎月決まって支払う費用を登録しましょう。</p>
            
            {/* Add Fixed Expense Form */}
            <form onSubmit={handleExpenseSubmit(addFixedExpense)} className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">項目名</label>
                  <input
                    type="text"
                    {...registerExpense('name', { required: true })}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="家賃"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">金額（円）</label>
                  <input
                    type="number"
                    {...registerExpense('amount', { required: true, min: 0 })}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">カテゴリ</label>
                  <select
                    {...registerExpense('category')}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="住居費">住居費</option>
                    <option value="光熱費">光熱費</option>
                    <option value="通信費">通信費</option>
                    <option value="保険">保険</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>追加</span>
              </button>
            </form>

            {/* Fixed Expenses List */}
            {fixedExpenses.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">登録された固定支出</h3>
                <div className="space-y-3">
                  {fixedExpenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                      <div>
                        <span className="font-semibold text-gray-900">{expense.name}</span>
                        <span className="text-gray-500 ml-2 text-sm">（{expense.category}）</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-gray-900">¥{expense.amount.toLocaleString()}</span>
                        <button
                          onClick={() => removeFixedExpense(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">月収:</span>
                      <span className="font-semibold">¥{monthlyIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">固定支出合計:</span>
                      <span className="font-semibold">¥{totalFixedExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleExpenseNext}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1"
            >
              次へ
            </button>
          </div>
        )}

        {/* Step 3: Savings Goal */}
        {step === 3 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">貯金目標を設定してください</h2>
                <p className="text-gray-600">達成したい目標を設定して、計画的に貯金しましょう。</p>
              </div>
            </div>
            
            <form onSubmit={handleGoalSubmit(handleFinalSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  目標のタイトル
                </label>
                <input
                  type="text"
                  {...registerGoal('title', { required: true })}
                  className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-lg font-medium bg-white/50 backdrop-blur-sm shadow-lg"
                  placeholder="海外旅行の資金"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  詳細・説明
                </label>
                <textarea
                  {...registerGoal('description')}
                  rows={3}
                  className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-lg"
                  placeholder="ヨーロッパ周遊旅行のために貯金したい"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    目標金額（円）
                  </label>
                  <input
                    type="number"
                    {...registerGoal('target_amount', { required: true, min: 0 })}
                    className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-lg font-medium bg-white/50 backdrop-blur-sm shadow-lg"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    達成予定日
                  </label>
                  <input
                    type="date"
                    {...registerGoal('target_date', { required: true })}
                    className="w-full px-6 py-4 border border-gray-300/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-lg font-medium bg-white/50 backdrop-blur-sm shadow-lg"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              {savingsGoal.target_amount > 0 && savingsGoal.target_date && (
                <div className="p-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg">💡 計算結果</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">月収:</span>
                      <span className="font-semibold">¥{monthlyIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">固定支出:</span>
                      <span className="font-semibold">¥{totalFixedExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">月間必要貯金額:</span>
                      <span className="font-semibold">¥{monthlyNeededForGoal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                      <span className="text-gray-700">月間利用可能額:</span>
                      <span className={availableAmount < 0 ? 'text-red-600' : 'text-green-600'}>
                        ¥{availableAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {availableAmount < 0 && (
                    <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/50">
                      <p className="text-red-700 text-sm font-medium">
                        ⚠️ 目標達成のためには支出を見直すか、期間を延長する必要があります
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-lg shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-1"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    <span>設定中...</span>
                  </div>
                ) : (
                  '設定完了'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/25">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">設定完了！</h2>
            <p className="text-lg text-gray-600 mb-6">
              初期設定が完了しました。<br />
              ダッシュボードに移動して、貯金管理を始めましょう！
            </p>
            
            <div className="space-y-3 text-sm text-gray-600 bg-green-50/80 backdrop-blur-sm rounded-xl p-6 border border-green-200/50">
              <div className="flex justify-between">
                <span>月収:</span>
                <span className="font-semibold">¥{monthlyIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>固定支出:</span>
                <span className="font-semibold">¥{totalFixedExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>貯金目標:</span>
                <span className="font-semibold">{savingsGoal.title}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                <span className="text-gray-700">月間利用可能額:</span>
                <span className="text-green-600">¥{availableAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="animate-pulse text-blue-600 font-medium">
                ダッシュボードに移動中...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}