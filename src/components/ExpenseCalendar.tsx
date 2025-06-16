import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Edit2, Trash2, Calendar as CalendarIcon, Plus, X, Save, DollarSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Expense, supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ExpenseCalendarProps {
  expenses: Expense[]
  onExpenseUpdate: () => void
}

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

export function ExpenseCalendar({ expenses, onExpenseUpdate }: ExpenseCalendarProps) {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<ExpenseForm>({
    defaultValues: {
      category: '食費',
    },
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => 
      isSameDay(new Date(expense.expense_date), date)
    )
  }

  const getDayTotal = (date: Date) => {
    return getExpensesForDate(date).reduce((sum, expense) => sum + expense.amount, 0)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    closeModal()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    closeModal()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsModalOpen(true)
    setIsAddingExpense(false)
    setEditingExpense(null)
    reset()
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setIsAddingExpense(false)
    setEditingExpense(null)
    reset()
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
      onExpenseUpdate()
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
      onExpenseUpdate()
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
      onExpenseUpdate()
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('更新に失敗しました')
    }
  }

  const selectedDayExpenses = selectedDate ? getExpensesForDate(selectedDate) : []
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth()

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'yyyy年MM月', { locale: ja })}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div key={day} className={`p-3 text-center text-sm font-semibold ${
            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {days.map((day) => {
          const dayExpenses = getExpensesForDate(day)
          const dayTotal = getDayTotal(day)
          const dayOfWeek = day.getDay()
          const inCurrentMonth = isCurrentMonth(day)
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => inCurrentMonth && handleDateClick(day)}
              className={`
                p-2 min-h-[80px] border rounded-lg text-left transition-all duration-200 hover:shadow-md relative
                ${inCurrentMonth 
                  ? 'hover:bg-gray-50/50 border-gray-200/50 cursor-pointer' 
                  : 'opacity-30 cursor-default border-gray-100'
                }
                ${isToday(day) && inCurrentMonth
                  ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 shadow-md ring-2 ring-blue-200' 
                  : ''
                }
              `}
            >
              <div className={`text-sm font-semibold mb-1 ${
                !inCurrentMonth ? 'text-gray-400' :
                dayOfWeek === 0 ? 'text-red-600' : 
                dayOfWeek === 6 ? 'text-blue-600' : 
                'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              
              {dayExpenses.length > 0 && inCurrentMonth && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded truncate">
                    ¥{dayTotal.toLocaleString()}
                  </div>
                  {dayExpenses.length > 1 && (
                    <div className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                      {dayExpenses.length}件
                    </div>
                  )}
                </div>
              )}
              
              {isToday(day) && inCurrentMonth && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          )
        })}
      </div>

      {/* Expense Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <CalendarIcon className="w-6 h-6 text-white" />
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
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Add Expense Button */}
              {!isAddingExpense && !editingExpense && (
                <div className="mb-6">
                  <button
                    onClick={() => setIsAddingExpense(true)}
                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {selectedDayExpenses.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <span>この日の支出</span>
                    <span className="text-sm font-normal text-gray-500">({selectedDayExpenses.length}件)</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedDayExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xl font-bold text-gray-900">
                              ¥{expense.amount.toLocaleString()}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                              {expense.category}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="text-sm text-gray-600">{expense.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
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
                        ¥{selectedDayExpenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                !isAddingExpense && !editingExpense && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CalendarIcon className="w-10 h-10 text-gray-400" />
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
          </div>
        </div>
      )}
    </div>
  )
}