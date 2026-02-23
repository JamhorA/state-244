-- Fix: Remove the broken unique constraint that only allows ONE person per alliance
-- The trigger "enforce_single_r5()" already correctly enforces "one R5 per alliance"
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS single_r5_per_alliance;
