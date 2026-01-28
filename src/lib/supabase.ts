import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Database types
export interface UserSettings {
  id: string
  user_id: string
  monthly_income: number
  bonus_amount: number
  bonus_months: string
  setup_completed: boolean
  created_at: string
  updated_at: string
}

export interface FixedExpense {
  id: string
  user_id: string
  name: string
  amount: number
  category: string
  created_at: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  title: string
  description: string
  target_amount: number
  target_date: string
  start_date?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: string
  description: string
  expense_date: string
  created_at: string
  updated_at: string
}

export interface MonthlyCarryover {
  id: string
  user_id: string
  year: number
  month: number
  carryover_amount: number
  created_at: string
  updated_at: string
}