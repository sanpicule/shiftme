/*
  # Add current savings balance to user settings

  1. Changes to user_settings table
    - Add `current_savings` column (numeric, default 0)
    - Allows users to track their actual current savings balance
    - This is independent of calculated budgets and serves as a reference point
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'current_savings'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN current_savings numeric DEFAULT 0;
  END IF;
END $$;
