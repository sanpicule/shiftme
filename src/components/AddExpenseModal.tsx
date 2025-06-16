import React from 'react'
import { useForm } from 'react-hook-form'
import { X, Plus, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onExpenseAdded: () => void
}

interface ExpenseForm {
  amount: number
  category: string
  description: string
  expense_date: string
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

export function AddExpenseModal({ isOpen, onClose, onExpenseAdded }: AddExpenseModalProps) {
  const { user } = useAuth()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ExpenseForm>({
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      category: '食費',
    },
  })

  const onSubmit = async (data: ExpenseForm) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...data,
          user_id: user.id,
        })

      if (error) throw error

      reset()
      onExpenseAdded()
      onClose()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('支出の追加に失敗しました')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">支出を追加</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              金額（円）
            </label>
            <input
              type="number"
              {...register('amount', { required: true, min: 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              カテゴリ
            </label>
            <select
              {...register('category', { required: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              説明・メモ
            </label>
            <input
              type="text"
              {...register('description')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="コンビニで昼食"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              日付
            </label>
            <input
              type="date"
              {...register('expense_date', { required: true })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>追加</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}