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
        <h3 className="text-lg font-semibold glass-text-strong">
          {format(currentDate, 'yyyy年MM月', { locale: ja })}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-glass-white-weak rounded-lg transition-colors glass-shine border border-white/20"
          >
            <ChevronLeft className="w-5 h-5 glass-icon" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-glass-white-weak rounded-lg transition-colors glass-shine border border-white/20"
          >
            <ChevronRight className="w-5 h-5 glass-icon" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border border-white/20 rounded-lg overflow-hidden backdrop-blur-sm bg-glass-white-weak">
        {/* Day Headers */}
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div key={day} className={`p-3 text-center text-sm font-semibold border-b border-white/30 last:border-r-0 bg-glass-white-weak ${
            index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'glass-text'
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
                p-2 min-h-[80px] border-r border-b border-white/20 last:border-r-0 relative transition-all duration-200 hover:shadow-glass-glow flex flex-col items-start glass-shine
                ${inCurrentMonth 
                  ? 'hover:bg-glass-white-weak cursor-pointer' 
                  : 'cursor-default'
                }
                  ${isToday(day) && inCurrentMonth
                    ? 'bg-gradient-to-br from-gray-500/30 to-gray-600/30 border-gray-400/50 shadow-glass-glow ring-2 ring-gray-400/30'
                    : ''
                  }
              `}
            >
              <div className={`text-sm font-semibold w-full text-center ${
                !inCurrentMonth ? 'text-white/40' :
                dayOfWeek === 0 ? 'text-gray-400' :
                dayOfWeek === 6 ? 'text-gray-300' :
                'glass-text'
              } ${isToday(day) && inCurrentMonth ? 'text-green-400' : ''}`}>
                {format(day, 'd')}
              </div>
              
              {dayExpenses.length > 0 && inCurrentMonth && (
                <div className="space-y-1">
                  {/* Desktop: Show expense details, Mobile: Show only marker */}
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-gray-300 bg-gray-500/20 backdrop-blur-sm px-1.5 py-0.5 rounded truncate border border-gray-400/30">
                      ¥{dayTotal.toLocaleString()}
                    </div>
                    {dayExpenses.length > 1 && (
                      <div className="text-xs glass-text bg-glass-white-weak px-1.5 py-0.5 rounded border border-white/20">
                        {dayExpenses.length}件
                      </div>
                    )}
                  </div>
                  {/* Mobile: Simple marker */}
                    <div className="md:hidden flex justify-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg"></div>
                    </div>
                </div>
              )}
              
              {isToday(day) && inCurrentMonth && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full animate-pulse shadow-lg"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}