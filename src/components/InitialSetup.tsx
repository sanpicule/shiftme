import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FixedExpenseForm {
  name: string;
  amount: number;
  category: string;
}

interface SavingsGoalForm {
  title: string;
  description: string;
  target_amount: number;
  target_date: string;
}

interface SetupForm {
  monthly_income: number;
}

export function InitialSetup() {
  const { user } = useAuth();
  const { updateUserSettings } = useUserSettings();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseForm[]>([]);
  const [savingsGoal] = useState<SavingsGoalForm>({
    title: '',
    description: '',
    target_amount: 0,
    target_date: '',
  });

  const { register: registerIncome, handleSubmit: handleIncomeSubmit } = useForm<SetupForm>();
  const {
    register: registerExpense,
    handleSubmit: handleExpenseSubmit,
    reset: resetExpense,
  } = useForm<FixedExpenseForm>();
  const { register: registerGoal, handleSubmit: handleGoalSubmit } = useForm<SavingsGoalForm>();

  const addFixedExpense = (data: FixedExpenseForm) => {
    // Convert amount to number to ensure proper calculation
    const expenseWithNumberAmount = {
      ...data,
      amount: Number(data.amount),
    };
    setFixedExpenses([...fixedExpenses, expenseWithNumberAmount]);
    resetExpense();
  };

  const removeFixedExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  const handleIncomeNext = (data: SetupForm) => {
    setMonthlyIncome(Number(data.monthly_income));
    setStep(2);
  };

  const handleExpenseNext = () => {
    setStep(3);
  };

  const handleFinalSubmit = async (goalData: SavingsGoalForm) => {
    if (!user) return;

    setLoading(true);
    try {
      // Save fixed expenses
      if (fixedExpenses.length > 0) {
        const expensesWithUserId = fixedExpenses.map(expense => ({
          ...expense,
          amount: Number(expense.amount),
          user_id: user.id,
        }));

        const { error: expensesError } = await supabase
          .from('fixed_expenses')
          .insert(expensesWithUserId);

        if (expensesError) throw expensesError;
      }

      // Save savings goal
      const { error: goalError } = await supabase.from('savings_goals').insert({
        ...goalData,
        target_amount: Number(goalData.target_amount),
        user_id: user.id,
      });

      if (goalError) throw goalError;

      // Update user settings to mark setup as completed
      const { error: settingsError } = await updateUserSettings({
        monthly_income: monthlyIncome,
        setup_completed: true,
      });

      if (settingsError) throw settingsError;

      // Show success message briefly, then force a page reload to trigger App.tsx re-evaluation
      setStep(4); // Show success step

      // Wait 2 seconds to show success message, then reload the page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error saving setup:', error);
      alert('設定の保存中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const totalFixedExpenses = fixedExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );
  const monthlyNeededForGoal =
    savingsGoal.target_amount && savingsGoal.target_date
      ? Math.ceil(
          Number(savingsGoal.target_amount) /
            Math.max(
              1,
              Math.ceil(
                (new Date(savingsGoal.target_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24 * 30),
              ),
            ),
        )
      : 0;
  const availableAmount = monthlyIncome - totalFixedExpenses - monthlyNeededForGoal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">初期設定</span>
            <span className="text-sm text-gray-500">{Math.min(step, 3)}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Monthly Income */}
        {step === 1 && (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">月収を教えてください</h2>
            <p className="text-gray-600 mb-6">
              毎月の収入を入力して、家計管理の基準を設定しましょう。
            </p>

            <form onSubmit={handleIncomeSubmit(handleIncomeNext)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">月収（円）</label>
                <input
                  type="number"
                  {...registerIncome('monthly_income', { required: true, min: 0 })}
                  className="glass-input w-full px-4 py-3 text-gray-800"
                  placeholder="300000"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-800 text-white w-full rounded-xl py-3 font-semibold"
              >
                次へ
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Fixed Expenses */}
        {step === 2 && (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">固定支出を登録してください</h2>
            <p className="text-gray-600 mb-6">
              家賃、光熱費、保険料など、毎月決まって支払う費用を登録しましょう。
            </p>

            {/* Add Fixed Expense Form */}
            <form onSubmit={handleExpenseSubmit(addFixedExpense)} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">項目名</label>
                  <input
                    type="text"
                    {...registerExpense('name', { required: true })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="家賃"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">金額（円）</label>
                  <input
                    type="number"
                    {...registerExpense('amount', { required: true, min: 0 })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">カテゴリ</label>
                  <select
                    {...registerExpense('category')}
                    className="glass-input w-full px-4 py-3 text-gray-800"
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
                className="glass-button-strong flex items-center gap-2 px-4 py-2.5 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>追加</span>
              </button>
            </form>

            {/* Fixed Expenses List */}
            {fixedExpenses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">登録された固定支出</h3>
                <div className="space-y-2">
                  {fixedExpenses.map((expense, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/60"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">{expense.name}</span>
                        <span className="text-gray-600 ml-2 text-sm">（{expense.category}）</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">
                          ¥{expense.amount.toLocaleString()}
                        </span>
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
                <div className="mt-4 p-4 glass-card">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">月収:</span>
                      <span className="font-semibold text-gray-900">
                        ¥{monthlyIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">固定支出合計:</span>
                      <span className="font-semibold text-gray-900">
                        ¥{totalFixedExpenses.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleExpenseNext}
              className="bg-slate-800 text-white w-full rounded-xl py-3 font-semibold"
            >
              次へ
            </button>
          </div>
        )}

        {/* Step 3: Savings Goal */}
        {step === 3 && (
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">貯金目標を設定してください</h2>
            <p className="text-gray-600 mb-6">達成したい目標を設定して、計画的に貯金しましょう。</p>

            <form onSubmit={handleGoalSubmit(handleFinalSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  目標のタイトル
                </label>
                <input
                  type="text"
                  {...registerGoal('title', { required: true })}
                  className="glass-input w-full px-4 py-3 text-gray-800"
                  placeholder="海外旅行の資金"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">詳細・説明</label>
                <textarea
                  {...registerGoal('description')}
                  rows={3}
                  className="glass-input w-full px-4 py-3 text-gray-800"
                  placeholder="ヨーロッパ周遊旅行のために貯金したい"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    目標金額（円）
                  </label>
                  <input
                    type="number"
                    {...registerGoal('target_amount', { required: true, min: 0 })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">達成予定日</label>
                  <input
                    type="date"
                    {...registerGoal('target_date', { required: true })}
                    className="glass-input w-full px-4 py-3 text-gray-800"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              {savingsGoal.target_amount > 0 && savingsGoal.target_date && (
                <div className="glass-card p-4">
                  <h4 className="font-bold text-gray-900 mb-3">💡 計算結果</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">月収:</span>
                      <span className="font-semibold text-gray-900">
                        ¥{monthlyIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">固定支出:</span>
                      <span className="font-semibold text-gray-900">
                        ¥{totalFixedExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">月間必要貯金額:</span>
                      <span className="font-semibold text-gray-900">
                        ¥{monthlyNeededForGoal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span className="text-gray-700">月間利用可能額:</span>
                      <span className={availableAmount < 0 ? 'text-red-600' : 'text-green-600'}>
                        ¥{availableAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {availableAmount < 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
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
                className="bg-slate-800 text-white w-full rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
          <div className="glass-card p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">設定完了！</h2>
            <p className="text-lg text-gray-600 mb-6">
              初期設定が完了しました。
              <br />
              ダッシュボードに移動して、貯金管理を始めましょう！
            </p>

            <div className="glass-card p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">月収:</span>
                <span className="font-semibold text-gray-900">
                  ¥{monthlyIncome.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">固定支出:</span>
                <span className="font-semibold text-gray-900">
                  ¥{totalFixedExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">貯金目標:</span>
                <span className="font-semibold text-gray-900">{savingsGoal.title}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span className="text-gray-700">月間利用可能額:</span>
                <span className="text-green-600">¥{availableAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="animate-pulse text-blue-600 font-medium">
                ダッシュボードに移動中...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
