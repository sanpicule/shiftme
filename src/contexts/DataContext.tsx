/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, Expense, FixedExpense, SavingsGoal } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useUserSettings } from '../hooks/useUserSettings';

interface DataContextProps {
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  savingsGoals: SavingsGoal[];
  allExpenses: Expense[];
  previousMonthCarryover: number;
  loading: boolean;
  refetchData: () => void;
}

const DataContext = React.createContext<DataContextProps | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userSettings } = useUserSettings();
  const [expenses] = useState<Expense[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [previousMonthCarryover, setPreviousMonthCarryover] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!user || !userSettings) return;

    if (!isRefetch) {
      setLoading(true);
    }
    
    try {
      // 一度のフェッチで必要なデータをすべて取得
      const { data: allExpensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: true });
      
      const { data: fixedData } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: goalsData } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setAllExpenses(allExpensesData || []);
      setFixedExpenses(fixedData || []);
      setSavingsGoals(goalsData || []);

      // 繰越額の計算 (DashboardとAnalyticsPageで共通)
      const startDate = userSettings.created_at ? new Date(userSettings.created_at) : null;
      const now = new Date();
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);

      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const { data: carryoverData, error: carryoverError } = await supabase
        .from('monthly_carryover')
        .select('carryover_amount')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .maybeSingle();

      let calculatedCarryover = 0;
      if (!startDate || prevMonth >= startOfMonth(startDate)) {
        const prevMonthStart = startOfMonth(prevMonth);
        const prevMonthEnd = endOfMonth(prevMonth);
        
        const prevMonthExpenses = (allExpensesData || []).filter(e => {
            const d = new Date(e.expense_date);
            return d >= prevMonthStart && d <= prevMonthEnd;
        });

        const totalPrevMonthExpenses = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const prevMonthIncome = userSettings.monthly_income || 0;
        const totalFixed = (fixedData || []).reduce((sum, f) => sum + f.amount, 0);

        const goal = (goalsData || [])[0];
        let neededForGoal = 0;
        if (goal) {
          const targetDate = new Date(goal.target_date);
          const creationDate = new Date(goal.created_at);
          const monthsAtCreation = Math.max(1, Math.ceil((targetDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          neededForGoal = Math.ceil(goal.target_amount / monthsAtCreation);
        }
        calculatedCarryover = prevMonthIncome - totalFixed - neededForGoal - totalPrevMonthExpenses;
      }
      if (carryoverError) {
        console.error('Error fetching monthly carryover:', carryoverError);
      }

      const resolvedCarryover = carryoverData?.carryover_amount ?? calculatedCarryover;
      setPreviousMonthCarryover(resolvedCarryover);

    } catch (error) {
      console.error('Error fetching shared data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userSettings]);

  useEffect(() => {
    if (user && userSettings) {
      fetchData();
    }
  }, [user, userSettings, fetchData]);
  
  const value = {
    expenses, // Note: This will be empty, individual pages should filter from allExpenses
    fixedExpenses,
    savingsGoals,
    allExpenses,
    previousMonthCarryover,
    loading,
    refetchData: () => fetchData(true),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
