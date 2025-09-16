-- Add start_date column to savings_goals
ALTER TABLE savings_goals
ADD COLUMN IF NOT EXISTS start_date date;

-- Optional: backfill nulls with current_date (comment out if not desired)
-- UPDATE savings_goals SET start_date = CURRENT_DATE WHERE start_date IS NULL;

