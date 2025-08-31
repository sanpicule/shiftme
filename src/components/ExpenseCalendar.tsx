import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Expense } from '../lib/supabase'

interface ExpenseCalendarProps {
  expenses: Expense[]
  onDateClick: (date: Date) => void
}



export function ExpenseCalendar({ expenses, onDateClick }: ExpenseCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())



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
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleDateClick = (date: Date) => {
    onDateClick(date)
  }



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
      <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div key={day} className={`p-3 text-center text-sm font-semibold border-b border-gray-400 last:border-r-0 bg-slate-300 ${
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
                p-2 min-h-[80px] border-r border-b border-gray-200 last:border-r-0 relative transition-all duration-200 hover:shadow-md flex flex-col items-start
                ${inCurrentMonth 
                  ? 'hover:bg-gray-50/50 cursor-pointer' 
                  : 'cursor-default'
                }
                ${isToday(day) && inCurrentMonth
                  ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 shadow-md ring-2 ring-blue-200' 
                  : ''
                }
              `}
            >
              <div className={`text-sm font-semibold w-full text-center ${
                !inCurrentMonth ? 'text-gray-400' :
                dayOfWeek === 0 ? 'text-red-600' : 
                dayOfWeek === 6 ? 'text-blue-600' : 
                'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              
              {dayExpenses.length > 0 && inCurrentMonth && (
                <div className="space-y-1">
                  {/* Desktop: Show expense details, Mobile: Show only marker */}
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded truncate">
                      ¥{dayTotal.toLocaleString()}
                    </div>
                    {dayExpenses.length > 1 && (
                      <div className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {dayExpenses.length}件
                      </div>
                    )}
                  </div>
                  {/* Mobile: Simple marker */}
                  <div className="md:hidden flex justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              )}
              
              {isToday(day) && inCurrentMonth && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </button>
          )
        })}
      </div>


    </div>
  )
}