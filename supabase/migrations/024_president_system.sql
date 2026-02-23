-- =====================================================
-- State 244 Hub - President System
-- Two-stage application approval with President role
-- =====================================================

-- 1. Add is_president flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_president BOOLEAN DEFAULT false;

-- Create unique partial index to ensure only one president
DROP INDEX IF EXISTS only_one_president;
CREATE UNIQUE INDEX only_one_president ON profiles ((1)) WHERE is_president = true;

-- 2. Add approval stage columns to migration_applications
ALTER TABLE migration_applications
  ADD COLUMN IF NOT EXISTS alliance_status TEXT DEFAULT 'pending' 
    CHECK (alliance_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS alliance_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS alliance_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS alliance_note TEXT CHECK (char_length(alliance_note) <= 500),
  ADD COLUMN IF NOT EXISTS president_status TEXT DEFAULT 'pending' 
    CHECK (president_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS president_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS president_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS president_note TEXT CHECK (char_length(president_note) <= 500);

-- 3. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_applications_alliance_status ON migration_applications(alliance_status);
CREATE INDEX IF NOT EXISTS idx_applications_president_status ON migration_applications(president_status);
CREATE INDEX IF NOT EXISTS idx_profiles_president ON profiles(is_president) WHERE is_president = true;

-- 4. Create function to update application status based on approval stages
CREATE OR REPLACE FUNCTION update_application_final_status()
RETURNS TRIGGER AS $$
BEGIN
  -- President rejection is final
  IF NEW.president_status = 'rejected' THEN
    NEW.status := 'rejected';
  -- Both approvals needed for final approval
  ELSIF NEW.alliance_status = 'approved' AND NEW.president_status = 'approved' THEN
    NEW.status := 'approved';
  -- Otherwise keep in reviewing state
  ELSE
    IF NEW.status = 'submitted' THEN
      NEW.status := 'reviewing';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for auto-updating status
DROP TRIGGER IF EXISTS update_application_status_trigger ON migration_applications;
CREATE TRIGGER update_application_status_trigger
  BEFORE UPDATE ON migration_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_application_final_status();

-- 6. Update existing applications to have reviewing status if they were in reviewing
UPDATE migration_applications 
SET status = 'reviewing',
    alliance_status = 'pending',
    president_status = 'pending'
WHERE status = 'reviewing';

-- Update approved applications (assume both approved in past)
UPDATE migration_applications 
SET alliance_status = 'approved',
    president_status = 'approved'
WHERE status = 'approved';

-- Update rejected applications (assume president rejected)
UPDATE migration_applications 
SET alliance_status = 'approved',
    president_status = 'rejected'
WHERE status = 'rejected';

-- 7. Grant permissions for president column
GRANT SELECT ON profiles TO authenticated;
