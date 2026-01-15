/*
  # Optimize RLS Policies for Performance

  1. Issue Resolution
    - Replace direct auth.uid() calls with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth.uid() for each row, improving query performance at scale
    - Affects all tables: expenses, fixed_expenses, savings_goals, user_settings

  2. Changes
    - Drop and recreate all RLS policies with optimized auth function calls
    - Policies remain functionally identical, only optimized for performance

  3. Security
    - No security changes, only performance optimization
    - RLS restrictions remain the same
*/

-- Drop existing policies that use auth.uid() directly
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

DROP POLICY IF EXISTS "Users can read own fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can insert own fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can update own fixed expenses" ON fixed_expenses;
DROP POLICY IF EXISTS "Users can delete own fixed expenses" ON fixed_expenses;

DROP POLICY IF EXISTS "Users can read own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can insert own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can update own savings goals" ON savings_goals;
DROP POLICY IF EXISTS "Users can delete own savings goals" ON savings_goals;

DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

-- Recreate policies with optimized auth function calls
-- User Settings Policies
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Fixed Expenses Policies
CREATE POLICY "Users can read own fixed expenses"
  ON fixed_expenses
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own fixed expenses"
  ON fixed_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own fixed expenses"
  ON fixed_expenses
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own fixed expenses"
  ON fixed_expenses
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Savings Goals Policies
CREATE POLICY "Users can read own savings goals"
  ON savings_goals
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own savings goals"
  ON savings_goals
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Expenses Policies
CREATE POLICY "Users can read own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));
