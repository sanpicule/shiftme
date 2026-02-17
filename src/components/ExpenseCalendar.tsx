import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Expense } from '../lib/supabase';
import { CalendarEvent, getEventsForDate } from '../lib/googleCalendar';

interface ExpenseCalendarProps {
  expenses: Expense[];
  onDateClick: (date: Date) => void;
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  actualMonthlySavings: number;
  calendarEvents?: CalendarEvent[];
}

export function ExpenseCalendar({
  expenses,
  onDateClick,
  currentDate,
  onMonthChange,
  actualMonthlySavings,
  calendarEvents = [],
}: ExpenseCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getExpensesForDate = (date: Date) => {
    return expenses.filter(expense => isSameDay(new Date(expense.expense_date), date));
  };

  const getDayTotal = (date: Date) => {
    return getExpensesForDate(date).reduce((sum, expense) => sum + expense.amount, 0);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onMonthChange(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onMonthChange(newDate);
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  const handleDateClick = (date: Date) => {
    onDateClick(date);
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between relative z-30">
        <div>
          <h3 className="text-2xl font-semibold glass-text-strong">
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </h3>
          <div
            className={`text-sm mt-1 ${actualMonthlySavings >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            今月の貯金: ¥{Math.abs(actualMonthlySavings).toLocaleString()}{' '}
            {actualMonthlySavings < 0 ? '(赤字)' : ''}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium glass-text hover:bg-glass-white-weak rounded-lg glass-card transition-colors glass-shine border border-gray-200"
          >
            今月
          </button>
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-glass-white-weak rounded-full transition-colors glass-shine border border-gray-200 glass-card"
          >
            <ChevronLeft className="w-5 h-5 glass-icon" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-glass-white-weak rounded-full transition-colors glass-shine border border-gray-200 glass-card"
          >
            <ChevronRight className="w-5 h-5 glass-icon" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 rounded-2xl shadow-md overflow-hidden  bg-glass-white-weak">
        {/* Day Headers */}
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center text-sm font-semibold border-gray-200 last:border-r-0 bg-white ${
              index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'glass-text'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((day, index) => {
          const dayExpenses = getExpensesForDate(day);
          const dayTotal = getDayTotal(day);
          const dayTotalLabel =
            dayTotal < 0
              ? `+¥${Math.abs(dayTotal).toLocaleString()}`
              : `¥${dayTotal.toLocaleString()}`;
          const dayOfWeek = day.getDay();
          const inCurrentMonth = isCurrentMonth(day);
          const dayEvents = getEventsForDate(calendarEvents, day);
          const isLastInRow = (index + 1) % 7 === 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => inCurrentMonth && handleDateClick(day)}
              aria-label={`${format(day, 'M月d日', { locale: ja })}${dayEvents.length > 0 ? `、カレンダーイベント${dayEvents.length}件` : ''}${dayExpenses.length > 0 ? `、支出${dayExpenses.length}件` : ''}`}
              className={`
                bg-white px-1 md:p-2 min-h-[80px] border-b border-gray-200 relative transition-all duration-200 md:hover:shadow-glass-glow flex flex-col items-start glass-shine gap-1
                ${!isLastInRow ? 'border-r' : ''}
                ${inCurrentMonth ? 'hover:bg-glass-white-weak cursor-pointer' : 'cursor-default'}
                  ${isToday(day) && inCurrentMonth ? 'border border-green-400 bg-green-500/10' : ''}
              `}
            >
              <div
                className={`text-sm font-semibold w-full text-center ${
                  !inCurrentMonth
                    ? 'text-white/40'
                    : dayOfWeek === 0
                      ? 'text-red-400'
                      : dayOfWeek === 6
                        ? 'text-blue-300'
                        : 'glass-text'
                } ${isToday(day) && inCurrentMonth ? 'text-green-400' : ''}`}
              >
                {format(day, 'd')}
              </div>

              {/* Calendar Events Indicator */}
              {dayEvents.length > 0 && inCurrentMonth && (
                <div className="w-full">
                  <div className="mx-auto text-[8px] md:text-xs font-medium text-blue-700 bg-blue-100   px-1 py-0.5 rounded truncate border border-blue-300/50">
                    📅 {dayEvents.length}件
                  </div>
                </div>
              )}

              {dayExpenses.length > 0 && inCurrentMonth && (
                <div className="space-y-1 w-full">
                  {/* Desktop: Show expense details, Mobile: Show only marker */}
                  <div>
                    <div
                      className={`mx-auto text-[8px] md:text-xs font-semibold text-white   px-1 py-0.5 rounded truncate border ${
                        dayTotal < 0
                          ? 'bg-emerald-500/80 border-emerald-400/50'
                          : 'bg-red-500/80 border-red-400/50'
                      }`}
                    >
                      {dayTotalLabel}
                    </div>
                    {dayExpenses.length > 1 && (
                      <div className="text-[12px] mt-1 md:text-xs md:px-1.5 py-0.5 text-start">
                        {dayExpenses.length}件
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isToday(day) && inCurrentMonth && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full animate-pulse shadow-lg"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
