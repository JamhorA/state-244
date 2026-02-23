-- =====================================================
-- State 244 Hub - RBAC System
-- Role-Based Access Control with superadmin, voting
-- =====================================================

-- 1. Drop policies that depend on the role column
DROP POLICY IF EXISTS profiles_public_read ON profiles;
DROP POLICY IF EXISTS profiles_member_read_own ON profiles;
DROP POLICY IF EXISTS profiles_r5_manage ON profiles;
DROP POLICY IF EXISTS applications_r4_read ON migration_applications;
DROP POLICY IF EXISTS applications_r4_update ON migration_applications;
DROP POLICY IF EXISTS presentations_r4_read ON alliance_presentations;
DROP POLICY IF EXISTS presentations_r5_create ON alliance_presentations;
DROP POLICY IF EXISTS alliances_r5_edit ON alliances;

-- 2. Add superadmin to user_role enum (cannot add before existing value in PostgreSQL)
-- We need to recreate the enum to add the value
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM ('superadmin', 'r5', 'r4', 'member');

-- Drop default, alter column type, then set new default
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles 
  ALTER COLUMN role TYPE user_role 
  USING 
    CASE role::text
      WHEN 'member' THEN 'member'::user_role
      WHEN 'r4' THEN 'r4'::user_role
      WHEN 'r5' THEN 'r5'::user_role
      ELSE 'member'::user_role
    END;
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'member'::user_role;

-- Update the trigger function to use new enum
DROP TRIGGER IF EXISTS enforce_single_r5_trigger ON profiles;
DROP FUNCTION IF EXISTS enforce_single_r5();

CREATE OR REPLACE FUNCTION enforce_single_r5()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'r5' THEN
    IF EXISTS (
      SELECT 1 FROM profiles
      WHERE alliance_id = NEW.alliance_id
      AND role = 'r5'
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Alliance can have only one R5';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_r5_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_single_r5();

-- Drop old enum
DROP TYPE user_role_old;

-- 2. Add can_edit_alliance flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_edit_alliance BOOLEAN DEFAULT false;

-- 3. Create state_info_proposals table for R5 voting
CREATE TABLE IF NOT EXISTS state_info_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  proposed_title TEXT NOT NULL,
  proposed_content TEXT NOT NULL,
  proposed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create state_info_votes table
CREATE TABLE IF NOT EXISTS state_info_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES state_info_proposals(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject')),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(proposal_id, voter_id)
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_status ON state_info_proposals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON state_info_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON state_info_votes(voter_id);

-- 6. First user becomes superadmin trigger
CREATE OR REPLACE FUNCTION first_user_superadmin()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles WHERE id != NEW.id;
  
  IF profile_count = 0 THEN
    NEW.role := 'superadmin'::user_role;
    NEW.can_edit_alliance := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create new one
DROP TRIGGER IF EXISTS set_first_user_superadmin ON profiles;
CREATE TRIGGER set_first_user_superadmin
  BEFORE INSERT ON profiles
  FOR EACH ROW 
  WHEN (pg_trigger_depth() = 0)
  EXECUTE FUNCTION first_user_superadmin();

-- 7. Enable RLS on new tables
ALTER TABLE state_info_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_info_votes ENABLE ROW LEVEL SECURITY;

-- 8. Create function to check if proposal should be approved
CREATE OR REPLACE FUNCTION check_proposal_approval(p_proposal_id UUID)
RETURNS void AS $$
DECLARE
  approve_count INTEGER;
  reject_count INTEGER;
  v_status TEXT;
BEGIN
  SELECT status INTO v_status FROM state_info_proposals WHERE id = p_proposal_id;
  
  IF v_status != 'pending' THEN
    RETURN;
  END IF;
  
  SELECT 
    COUNT(*) FILTER (WHERE vote = 'approve'),
    COUNT(*) FILTER (WHERE vote = 'reject')
  INTO approve_count, reject_count
  FROM state_info_votes
  WHERE proposal_id = p_proposal_id;
  
  -- If any reject, mark as rejected
  IF reject_count > 0 THEN
    UPDATE state_info_proposals 
    SET status = 'rejected', resolved_at = NOW()
    WHERE id = p_proposal_id;
    RETURN;
  END IF;
  
  -- If 2+ approvals, apply changes and mark approved
  IF approve_count >= 2 THEN
    UPDATE state_info si
    SET 
      title = sip.proposed_title,
      content = sip.proposed_content,
      updated_at = NOW()
    FROM state_info_proposals sip
    WHERE sip.id = p_proposal_id AND si.section_key = sip.section_key;
    
    UPDATE state_info_proposals 
    SET status = 'approved', resolved_at = NOW()
    WHERE id = p_proposal_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
