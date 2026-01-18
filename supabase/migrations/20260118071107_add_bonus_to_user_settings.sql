/*
  # Add Bonus Feature to User Settings

  1. Changes
    - `user_settings` table
      - Add `bonus_amount` (decimal) - ボーナス金額
      - Add `bonus_months` (text) - ボーナス支給月（カンマ区切り、例："3,9"）

  2. Details
    - bonus_amount: ボーナス１回あたりの金額
    - bonus_months: ボーナスが支給される月を数字でカンマ区切り（例："3,9"は3月と9月）
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'bonus_amount'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN bonus_amount decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'bonus_months'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN bonus_months text DEFAULT '';
  END IF;
END $$;
