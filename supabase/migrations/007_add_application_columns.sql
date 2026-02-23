-- Add new specific columns for the migration_applications table
ALTER TABLE migration_applications
ADD COLUMN current_alliance TEXT,
ADD COLUMN troop_level TEXT,
ADD COLUMN arena_power TEXT,
ADD COLUMN duel_points TEXT,
ADD COLUMN svs_participation TEXT,
ADD COLUMN screenshots TEXT[] DEFAULT '{}';
