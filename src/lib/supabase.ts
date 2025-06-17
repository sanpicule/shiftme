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

// Handle invalid refresh token errors by clearing the session
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    // Clear any stale session data
    supabase.auth.signOut()
  }
})

// Clear any existing invalid session on initialization
const clearInvalidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error && error.message.includes('refresh_token_not_found')) {
      await supabase.auth.signOut()
    }
  } catch (error) {
    // If there's any error getting the session, clear it
    await supabase.auth.signOut()
  }
}

// Initialize session cleanup
clearInvalidSession()

// Database types
export interface UserSettings {
  id: string
  user_id: string
  monthly_income: number
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