import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, Target } from 'lucide-react'
import { useUserSettings } from '../hooks/useUserSettings'
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
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoalForm>({
    title: '',
    description: '',
    target_amount: 0,
    target_date: '',
  })

  const { register: registerIncome, handleSubmit: handleIncomeSubmit } = useForm<SetupForm>()
  const { register: registerExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense } = useForm<FixedExpenseForm>()
  const { register: registerGoal, handleSubmit: handleGoalSubmit } = useForm<SavingsGoalForm>()

  const addFixedExpense = (data: FixedExpenseForm) => {
    setFixedExpenses([...fixedExpenses, data])
    resetExpense()
  }

  const removeFixedExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index))
  }

  const handleIncomeNext = (data: SetupForm) => {
    setMonthlyIncome(data.monthly_income)
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
          user_id: user.id,
        })
      
      if (goalError) throw goalError

      // Update user settings to mark setup as completed
      const { error: settingsError } = await updateUserSettings({
        monthly_income: monthlyIncome,
        setup_completed: true,
      })
      
      if (settingsError) throw settingsError

      // The App component will automatically redirect to Dashboard
      // when setup_completed becomes true
      
    } catch (error) {
      console.error('Error saving setup:', error)
      alert('設定の保存中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const totalFixedExpenses = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const monthlyNeededForGoal = savingsGoal.target_amount && savingsGoal.target_date
    ? Math.ceil(savingsGoal.target_amount / Math.max(1, Math.ceil((new Date(savingsGoal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))))
    : 0
  const availableAmount = monthlyIncome - totalFixedExpenses - monthlyNeededForGoal

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">初期設定</span>
            <span className="text-sm text-gray-500">{step}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Monthly Income */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">月収を教えてください</h2>
            <form onSubmit={handleIncomeSubmit(handleIncomeNext)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月収（円）
                </label>
                <input
                  type="number"
                  {...registerIncome('monthly_income', { required: true, min: 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="300000"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                次へ
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Fixed Expenses */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">固定支出を登録してください</h2>
            
            {/* Add Fixed Expense Form */}
            <form onSubmit={handleExpenseSubmit(addFixedExpense)} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">項目名</label>
                  <input
                    type="text"
                    {...registerExpense('name', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="家賃"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">金額（円）</label>
                  <input
                    type="number"
                    {...registerExpense('amount', { required: true, min: 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                  <select
                    {...registerExpense('category')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>追加</span>
              </button>
            </form>

            {/* Fixed Expenses List */}
            {fixedExpenses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">登録された固定支出</h3>
                <div className="space-y-2">
                  {fixedExpenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium">{expense.name}</span>
                        <span className="text-gray-500 ml-2">（{expense.category}）</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
                        <button
                          onClick={() => removeFixedExpense(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>月収:</span>
                    <span>¥{monthlyIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>固定支出合計:</span>
                    <span>¥{totalFixedExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2 mt-2">
                    <span>残り:</span>
                    <span>¥{(monthlyIncome - totalFixedExpenses).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleExpenseNext}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              次へ
            </button>
          </div>
        )}

        {/* Step 3: Savings Goal */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">貯金目標を設定してください</h2>
            </div>
            
            <form onSubmit={handleGoalSubmit(handleFinalSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標のタイトル
                </label>
                <input
                  type="text"
                  {...registerGoal('title', { required: true })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="海外旅行の資金"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  詳細・説明
                </label>
                <textarea
                  {...registerGoal('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ヨーロッパ周遊旅行のために貯金したい"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目標金額（円）
                  </label>
                  <input
                    type="number"
                    {...registerGoal('target_amount', { required: true, min: 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    達成予定日
                  </label>
                  <input
                    type="date"
                    {...registerGoal('target_date', { required: true })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              {savingsGoal.target_amount > 0 && savingsGoal.target_date && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">計算結果</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>月収:</span>
                      <span>¥{monthlyIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>固定支出:</span>
                      <span>¥{totalFixedExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>月間必要貯金額:</span>
                      <span>¥{monthlyNeededForGoal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1 mt-2">
                      <span>月間利用可能額:</span>
                      <span className={availableAmount < 0 ? 'text-red-600' : 'text-green-600'}>
                        ¥{availableAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {availableAmount < 0 && (
                    <p className="text-red-600 text-sm mt-2">
                      ⚠️ 目標達成のためには支出を見直すか、期間を延長する必要があります
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '設定中...' : '設定完了'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}