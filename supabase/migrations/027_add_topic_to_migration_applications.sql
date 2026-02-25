-- =====================================================
-- Add topic/subject line to migration applications
-- =====================================================

ALTER TABLE migration_applications
ADD COLUMN IF NOT EXISTS topic TEXT;

UPDATE migration_applications
SET topic = COALESCE(NULLIF(trim(topic), ''), 'General Migration')
WHERE topic IS NULL OR trim(topic) = '';

ALTER TABLE migration_applications
ALTER COLUMN topic SET DEFAULT 'General Migration';

ALTER TABLE migration_applications
ALTER COLUMN topic SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'migration_applications_topic_length_check'
  ) THEN
    ALTER TABLE migration_applications
    ADD CONSTRAINT migration_applications_topic_length_check
    CHECK (char_length(trim(topic)) BETWEEN 3 AND 120);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_topic ON migration_applications(topic);
