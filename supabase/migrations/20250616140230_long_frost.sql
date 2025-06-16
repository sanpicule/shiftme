/*
  # Shiftme App Database Schema

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `monthly_income` (decimal)
      - `setup_completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `fixed_expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `amount` (decimal)
      - `category` (text)
      - `created_at` (timestamp)
    
    - `savings_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `description` (text)
      - `target_amount` (decimal)
      - `target_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `expenses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `amount` (decimal)
      - `category` (text)
      - `description` (text)
      - `expense_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monthly_income decimal(10,2) DEFAULT 0,
  setup_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Fixed Expenses Table
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text DEFAULT 'その他',
  created_at timestamptz DEFAULT now()
);

-- Savings Goals Table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  target_amount decimal(10,2) NOT NULL,
  target_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text DEFAULT 'その他',
  description text DEFAULT '',
  expense_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- User Settings Policies
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fixed Expenses Policies
CREATE POLICY "Users can read own fixed expenses"
  ON fixed_expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fixed expenses"
  ON fixed_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fixed expenses"
  ON fixed_expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fixed expenses"
  ON fixed_expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can read own savings goals"
  ON savings_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON savings_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can read own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_user_id ON fixed_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date, user_id);