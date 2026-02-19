import { useRef, useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, ListPlus } from 'lucide-react';
import { Expense } from '../lib/supabase';
import { CalendarEvent, getEventsForDate } from '../lib/googleCalendar';

interface ExpenseCalendarProps {
  expenses: Expense[];
  onDateClick: (date: Date) => void;
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  actualMonthlySavings: number;
  calendarEvents?: CalendarEvent[];
  onBulkAdd?: () => void;
  loading?: boolean;
}

const PEEK = 16; // px: adjacent slide が覗く量
const SWIPE_THRESHOLD = 50; // px: スワイプ判定の閾値

/** 1ヶ月分のカレンダーグリッドを描画（前後月はプレビュー用で非インタラクティブ） */
function CalendarGrid({
  monthDate,
  expenses,
  calendarEvents,
  onDateClick,
  isActive,
  isLoading,
}: {
  monthDate: Date;
  expenses: Expense[];
  calendarEvents: CalendarEvent[];
  onDateClick: (date: Date) => void;
  isActive: boolean;
  isLoading?: boolean;
}) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 0 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
  });

  const getExpensesForDate = (date: Date) =>
    expenses.filter(e => isSameDay(new Date(e.expense_date), date));

  const getDayTotal = (date: Date) =>
    getExpensesForDate(date).reduce((sum, e) => sum + e.amount, 0);

  const inMonth = (date: Date) => date.getMonth() === monthDate.getMonth();

  return (
    <div
      className={`grid grid-cols-7 rounded-2xl shadow-md overflow-hidden bg-glass-white-weak transition-opacity duration-300 ${
        isActive ? 'opacity-100' : 'opacity-40 pointer-events-none select-none'
      }`}
    >
      {/* Day Headers */}
      {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
        <div
          key={day}
          className={`p-3 text-center text-sm font-semibold bg-white ${
            index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'glass-text'
          }`}
        >
          {day}
        </div>
      ))}

      {/* Calendar Days — loading 中はセルのみ Skeleton */}
      {isActive && isLoading
        ? days.map((_, i) => (
            <div
              key={i}
              className="bg-white px-1 min-h-[80px] border-b border-r border-gray-200 flex items-start p-2"
            >
              <div className="h-4 w-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded animate-pulse mx-auto mt-1" />
            </div>
          ))
        : days.map((day, index) => {
        const dayExpenses = getExpensesForDate(day);
        const dayTotal = getDayTotal(day);
        const dayTotalLabel =
          dayTotal < 0
            ? `+¥${Math.abs(dayTotal).toLocaleString()}`
            : `¥${dayTotal.toLocaleString()}`;
        const dayOfWeek = day.getDay();
        const inCurrentMonth = inMonth(day);
        const dayEvents = isActive ? getEventsForDate(calendarEvents, day) : [];
        const isLastInRow = (index + 1) % 7 === 0;

        return (
          <button
            key={day.toISOString()}
            onClick={() => isActive && inCurrentMonth && onDateClick(day)}
            aria-label={`${format(day, 'M月d日', { locale: ja })}`}
            className={`
              bg-white px-1 md:p-2 min-h-[80px] border-b border-gray-200 relative transition-all duration-200 md:hover:shadow-glass-glow flex flex-col items-start glass-shine gap-1
              ${!isLastInRow ? 'border-r' : ''}
              ${isActive && inCurrentMonth ? 'hover:bg-glass-white-weak cursor-pointer' : 'cursor-default'}
              ${isActive && isToday(day) && inCurrentMonth ? 'border border-green-400 bg-green-500/10' : ''}
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
              } ${isActive && isToday(day) && inCurrentMonth ? 'text-green-400' : ''}`}
            >
              {format(day, 'd')}
            </div>

            {isActive && dayEvents.length > 0 && inCurrentMonth && (
              <div className="w-full">
                <div className="mx-auto text-[8px] md:text-xs font-medium text-blue-700 bg-blue-100 px-1 py-0.5 rounded truncate border border-blue-300/50">
                  📅 {dayEvents.length}件
                </div>
              </div>
            )}

            {isActive && dayExpenses.length > 0 && inCurrentMonth && (
              <div className="space-y-1 w-full">
                <div>
                  <div
                    className={`mx-auto text-[8px] md:text-xs font-semibold text-white px-1 py-0.5 rounded truncate border ${
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

            {isActive && isToday(day) && inCurrentMonth && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full animate-pulse shadow-lg" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ExpenseCalendar({
  expenses,
  onDateClick,
  currentDate,
  onMonthChange,
  actualMonthlySavings,
  calendarEvents = [],
  onBulkAdd,
  loading = false,
}: ExpenseCalendarProps) {
  const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

  // ── カルーセル制御 ──────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  // null=idle / 'prev'|'next'=snapping / 'center'=spring back
  const [snapTarget, setSnapTarget] = useState<'prev' | 'next' | 'center' | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0); // native handler 用

  // コンテナ幅を計測
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // touchmove は passive:false が必要（横スクロール防止）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || touchStartX.current === null) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - (touchStartY.current ?? 0);
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        dragOffsetRef.current = dx;
        setDragOffset(dx);
      }
    };
    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingRef.current = true;
    dragOffsetRef.current = 0;
    setSnapTarget(null);
    setDragOffset(0);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    const dx = dragOffsetRef.current;
    touchStartX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      setSnapTarget(dx < 0 ? 'next' : 'prev');
    } else {
      setSnapTarget('center');
    }
  };

  // スナップアニメーション完了後に月を切り替えてリセット
  const handleTransitionEnd = () => {
    if (snapTarget === 'next') {
      onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (snapTarget === 'prev') {
      onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setSnapTarget(null);
  };

  // ── 座標計算 ──────────────────────────────────────────────────
  // スライド幅 = コンテナ幅 - 左右PEEK分
  const slideWidth = containerWidth > 0 ? containerWidth - 2 * PEEK : 0;
  // center位置: スライド1(index=1)を PEEK 分だけ右にずらして表示
  //   translate = -(slideWidth - PEEK)
  const centerTranslate = slideWidth > 0 ? -(slideWidth - PEEK) : 0;

  const getTranslate = () => {
    if (snapTarget === 'next') return centerTranslate - slideWidth;
    if (snapTarget === 'prev') return centerTranslate + slideWidth;
    return centerTranslate + dragOffset;
  };

  const hasTransition = snapTarget !== null;

  // ── PC 用ボタン月切り替え ─────────────────────────────────────
  const prevMonth = () =>
    onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () =>
    onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => onMonthChange(new Date());

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
            今月の貯金: ¥{Math.abs(actualMonthlySavings).toLocaleString()}
            {actualMonthlySavings < 0 ? ' (赤字)' : ''}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onBulkAdd && (
            <button
              onClick={onBulkAdd}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium glass-text hover:bg-glass-white-weak rounded-lg glass-card transition-colors glass-shine border border-gray-200"
              title="一括登録"
            >
              <ListPlus className="w-4 h-4 glass-icon" />
              <span className="hidden sm:inline">一括登録</span>
            </button>
          )}
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium glass-text hover:bg-glass-white-weak rounded-lg glass-card transition-colors glass-shine border border-gray-200"
          >
            今月
          </button>
          {/* PC のみ表示 */}
          <button
            onClick={prevMonth}
            className="hidden md:flex p-2 hover:bg-glass-white-weak rounded-full transition-colors glass-shine border border-gray-200 glass-card"
          >
            <ChevronLeft className="w-5 h-5 glass-icon" />
          </button>
          <button
            onClick={nextMonth}
            className="hidden md:flex p-2 hover:bg-glass-white-weak rounded-full transition-colors glass-shine border border-gray-200 glass-card"
          >
            <ChevronRight className="w-5 h-5 glass-icon" />
          </button>
        </div>
      </div>

      {/* Carousel — 前後月が PEEK 分だけ左右に見える */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(${getTranslate()}px)`,
            transition: hasTransition
              ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              : 'none',
            willChange: 'transform',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {[prevMonthDate, currentDate, nextMonthDate].map((date, i) => (
            <div
              key={`${date.getFullYear()}-${date.getMonth()}`}
              style={{ flex: `0 0 ${slideWidth}px`, minWidth: `${slideWidth}px` }}
            >
              <CalendarGrid
                monthDate={date}
                expenses={expenses}
                calendarEvents={calendarEvents}
                onDateClick={onDateClick}
                isActive={i === 1}
                isLoading={i === 1 && loading}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
