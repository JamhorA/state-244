-- Update existing applications with the new dummy data fields so UI doesn't crash if it expects them
UPDATE migration_applications
SET 
  current_alliance = '[ABC] Test Alliance',
  troop_level = 'T10',
  arena_power = '5000000',
  duel_points = 'More than 200m',
  svs_participation = 'Yes',
  screenshots = ARRAY['https://example.com/screenshot1.png']
WHERE current_alliance IS NULL;
