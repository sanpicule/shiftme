/*
  # Add Monthly Carryover Feature

  1. New Tables
    - `monthly_carryover`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `year` (integer) - 対象年
      - `month` (integer) - 対象月（1-12）
      - `carryover_amount` (decimal) - 繰越金額（マイナスの場合は赤字を表す）
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Details
    - 前月の結果（黒字または赤字）を次月に繰り越す
    - carryover_amountがマイナスの場合は赤字を表す
    - 各月のデータは一意（user_id, year, monthの組み合わせ）

  3. Security
    - Enable RLS on `monthly_carryover` table
    - Add policies for authenticated users to read/write their own carryover data
*/

-- Create Monthly Carryover Table
CREATE TABLE IF NOT EXISTS monthly_carryover (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  carryover_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Enable RLS
ALTER TABLE monthly_carryover ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own carryover"
  ON monthly_carryover
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own carryover"
  ON monthly_carryover
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carryover"
  ON monthly_carryover
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_monthly_carryover_user_id ON monthly_carryover(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_carryover_period ON monthly_carryover(user_id, year, month);
