/*
  # Add current_amount to savings_goals table

  1. Changes
    - `savings_goals` table
      - Add `current_amount` column to track current savings progress
      - Default to 0
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'savings_goals' AND column_name = 'current_amount'
  ) THEN
    ALTER TABLE savings_goals ADD COLUMN current_amount numeric DEFAULT 0;
  END IF;
END $$;