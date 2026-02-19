import { useState, useMemo } from 'react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { X, Save, Calendar } from 'lucide-react';
import { Modal, Box } from '@mui/material';

interface BulkExpenseForm {
  amount: string;
  category: string;
  description: string;
  type: 'expense' | 'income';
  startDate: string;
  endDate: string;
  selectedDays: number[]; // 0=日, 1=月, ..., 6=土
}

interface BulkExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entries: { date: string; amount: number; category: string; description: string }[]) => Promise<void>;
  currentDate: Date;
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const categories = ['食費', '交通費', '娯楽', '衣服', '医療', '日用品', '教育', 'その他'];

export function BulkExpenseModal({ open, onClose, onSubmit, currentDate }: BulkExpenseModalProps) {
  const monthStr = format(currentDate, 'yyyy-MM');

  const [form, setForm] = useState<BulkExpenseForm>({
    amount: '',
    category: '食費',
    description: '',
    type: 'expense',
    startDate: `${monthStr}-01`,
    endDate: format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd'),
    selectedDays: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day],
    }));
  };

  const previewDates = useMemo(() => {
    if (!form.startDate || !form.endDate || form.selectedDays.length === 0) return [];
    try {
      const start = parseISO(form.startDate);
      const end = parseISO(form.endDate);
      if (end < start) return [];
      return eachDayOfInterval({ start, end }).filter(d =>
        form.selectedDays.includes(d.getDay()),
      );
    } catch {
      return [];
    }
  }, [form.startDate, form.endDate, form.selectedDays]);

  const handleSubmit = async () => {
    if (!form.amount || previewDates.length === 0) return;
    const rawAmount = parseFloat(form.amount);
    if (isNaN(rawAmount) || rawAmount <= 0) return;

    const normalizedAmount = form.type === 'income' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const normalizedCategory = form.type === 'income' ? '収入' : form.category;

    const entries = previewDates.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      amount: normalizedAmount,
      category: normalizedCategory,
      description: form.description,
    }));

    setIsSubmitting(true);
    try {
      await onSubmit(entries);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      keepMounted={false}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(255, 255, 255)',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <Box
        className="glass-modal glass-shine glass-scrollbar"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95vw',
          maxWidth: '600px',
          maxHeight: '90vh',
          bgcolor: 'transparent',
          borderRadius: '24px',
          boxShadow: 'none',
          outline: 'none',
          overflowY: 'auto',
          '@media (max-width: 640px)': {
            width: '100vw',
            height: '100vh',
            maxHeight: '100vh',
            borderRadius: '0',
          },
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 glass-icon" />
            <h2 className="text-lg font-bold glass-text-strong">支出の一括登録</h2>
          </div>
          <button
            onClick={onClose}
            className="glass-text p-2 hover:bg-glass-white-weak rounded-lg transition-colors border border-white/10"
          >
            <X className="w-5 h-5 glass-icon" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* 種別 */}
          <div>
            <label className="block text-sm font-semibold glass-text mb-2">種別</label>
            <div className="flex gap-2">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setForm(prev => ({
                      ...prev,
                      type: t,
                      category: t === 'income' ? '収入' : '食費',
                    }))
                  }
                  className={`px-4 py-2 rounded-xl border transition-colors ${
                    form.type === t
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white/5 border-white/20 text-gray-800'
                  }`}
                >
                  {t === 'expense' ? '支出' : '収入'}
                </button>
              ))}
            </div>
          </div>

          {/* 金額・カテゴリ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold glass-text mb-2">金額（円）</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl glass-input text-lg font-medium"
                placeholder="1000"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold glass-text mb-2">カテゴリ</label>
              {form.type === 'income' ? (
                <input
                  type="text"
                  value="収入"
                  readOnly
                  className="w-full px-4 py-3 rounded-xl glass-input"
                />
              ) : (
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl glass-input"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-semibold glass-text mb-2">説明・メモ</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl glass-input"
              placeholder="コンビニで昼食"
            />
          </div>

          {/* 期間 */}
          <div>
            <label className="block text-sm font-semibold glass-text mb-2">期間</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl glass-input"
              />
              <span className="glass-text text-sm">〜</span>
              <input
                type="date"
                value={form.endDate}
                onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl glass-input"
              />
            </div>
          </div>

          {/* 曜日選択 */}
          <div>
            <label className="block text-sm font-semibold glass-text mb-2">
              登録する曜日を選択
            </label>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    form.selectedDays.includes(idx)
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white/5 border-white/20'
                  } ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : ''} ${
                    form.selectedDays.includes(idx) ? '!text-white' : ''
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* プレビュー */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold glass-text">登録される日付</label>
              <span className="text-sm glass-text">{previewDates.length}件</span>
            </div>
            {previewDates.length === 0 ? (
              <p className="text-sm glass-text py-3 text-center">
                曜日と期間を選択すると日付が表示されます
              </p>
            ) : (
              <div className="max-h-32 overflow-y-auto glass-scrollbar glass-card p-3 rounded-xl">
                <div className="flex flex-wrap gap-2">
                  {previewDates.map(d => (
                    <span
                      key={d.toISOString()}
                      className="text-xs px-2 py-1 rounded-lg bg-gray-800/10 glass-text"
                    >
                      {format(d, 'M/d（E）', { locale: ja })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 glass-button font-medium rounded-xl"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || previewDates.length === 0 || !form.amount}
              className="flex-1 px-6 py-3 glass-button-primary text-white bg-gray-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>{previewDates.length}件を一括登録</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Box>
    </Modal>
  );
}
