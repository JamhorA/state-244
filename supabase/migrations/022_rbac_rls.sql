-- =====================================================
-- State 244 Hub - RBAC RLS Policies
-- =====================================================

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'superadmin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::text INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to get user's alliance_id
CREATE OR REPLACE FUNCTION get_user_alliance_id()
RETURNS UUID AS $$
DECLARE
  v_alliance_id UUID;
BEGIN
  SELECT alliance_id INTO v_alliance_id FROM profiles WHERE id = auth.uid();
  RETURN v_alliance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PROFILES RLS Policies
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS profiles_public_read ON profiles;
DROP POLICY IF EXISTS profiles_member_read_own ON profiles;
DROP POLICY IF EXISTS profiles_r5_manage ON profiles;

-- Superadmin: full access to all profiles
CREATE POLICY "superadmin_profiles_all" ON profiles
  FOR ALL USING (is_superadmin());

-- R5: manage profiles in their own alliance
CREATE POLICY "r5_manage_alliance_profiles" ON profiles
  FOR ALL USING (
    NOT is_superadmin() 
    AND get_user_role() = 'r5' 
    AND alliance_id = get_user_alliance_id()
  );

-- R4 with permission: create members in their alliance
CREATE POLICY "r4_create_members" ON profiles
  FOR INSERT WITH CHECK (
    NOT is_superadmin()
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('r4', 'r5')
      AND (p.role = 'r5' OR p.can_edit_alliance = true)
      AND p.alliance_id = profiles.alliance_id
    )
  );

-- R4: view profiles in their alliance
CREATE POLICY "r4_read_alliance_profiles" ON profiles
  FOR SELECT USING (
    is_superadmin() 
    OR alliance_id = get_user_alliance_id()
  );

-- Members: read own profile
CREATE POLICY "member_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Members: update own profile (limited fields)
CREATE POLICY "member_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- ALLIANCES RLS Policies
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS alliances_r5_edit ON alliances;

-- Superadmin: full access to alliances
CREATE POLICY "superadmin_alliances_all" ON alliances
  FOR ALL USING (is_superadmin());

-- R5: edit own alliance
CREATE POLICY "r5_edit_own_alliance" ON alliances
  FOR UPDATE USING (
    NOT is_superadmin()
    AND get_user_role() = 'r5'
    AND id = get_user_alliance_id()
  );

-- R4 with permission: edit own alliance
CREATE POLICY "r4_edit_own_alliance" ON alliances
  FOR UPDATE USING (
    NOT is_superadmin()
    AND get_user_role() = 'r4'
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.can_edit_alliance = true
    )
    AND id = get_user_alliance_id()
  );

-- =====================================================
-- STATE_INFO RLS Policies
-- =====================================================

-- Public: read state_info
CREATE POLICY "public_read_state_info" ON state_info
  FOR SELECT USING (true);

-- Superadmin: full access
CREATE POLICY "superadmin_state_info_all" ON state_info
  FOR ALL USING (is_superadmin());

-- =====================================================
-- STATE_INFO_PROPOSALS RLS Policies
-- =====================================================

-- Superadmin: full access
CREATE POLICY "superadmin_proposals_all" ON state_info_proposals
  FOR ALL USING (is_superadmin());

-- R5: read all proposals
CREATE POLICY "r5_read_proposals" ON state_info_proposals
  FOR SELECT USING (
    NOT is_superadmin() AND get_user_role() = 'r5'
  );

-- R5: create proposals
CREATE POLICY "r5_create_proposals" ON state_info_proposals
  FOR INSERT WITH CHECK (
    NOT is_superadmin() AND get_user_role() = 'r5'
  );

-- R5: update own proposals (only if pending)
CREATE POLICY "r5_update_own_proposals" ON state_info_proposals
  FOR UPDATE USING (
    NOT is_superadmin() 
    AND get_user_role() = 'r5' 
    AND proposed_by = auth.uid()
    AND status = 'pending'
  );

-- =====================================================
-- STATE_INFO_VOTES RLS Policies
-- =====================================================

-- Superadmin: full access
CREATE POLICY "superadmin_votes_all" ON state_info_votes
  FOR ALL USING (is_superadmin());

-- R5: read all votes
CREATE POLICY "r5_read_votes" ON state_info_votes
  FOR SELECT USING (
    NOT is_superadmin() AND get_user_role() = 'r5'
  );

-- R5: create own vote
CREATE POLICY "r5_create_vote" ON state_info_votes
  FOR INSERT WITH CHECK (
    NOT is_superadmin() 
    AND get_user_role() = 'r5'
    AND voter_id = auth.uid()
  );

-- =====================================================
-- MIGRATION_APPLICATIONS RLS Policies
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS applications_r4_read ON migration_applications;
DROP POLICY IF EXISTS applications_r4_update ON migration_applications;

-- R4/R5: read applications for their alliance
CREATE POLICY "officers_read_applications" ON migration_applications
  FOR SELECT USING (
    is_superadmin()
    OR (
      get_user_role() IN ('r4', 'r5')
      AND target_alliance_id = get_user_alliance_id()
    )
  );

-- R4/R5: update applications for their alliance
CREATE POLICY "officers_update_applications" ON migration_applications
  FOR UPDATE USING (
    is_superadmin()
    OR (
      get_user_role() IN ('r4', 'r5')
      AND target_alliance_id = get_user_alliance_id()
    )
  );

-- =====================================================
-- ALLIANCE_PRESENTATIONS RLS Policies
-- =====================================================

-- Drop old policies
DROP POLICY IF EXISTS presentations_r4_read ON alliance_presentations;
DROP POLICY IF EXISTS presentations_r5_create ON alliance_presentations;

-- R4/R5: read own alliance presentations
CREATE POLICY "officers_read_presentations" ON alliance_presentations
  FOR SELECT USING (
    is_superadmin()
    OR (
      get_user_role() IN ('r4', 'r5')
      AND alliance_id = get_user_alliance_id()
    )
  );

-- R5: create presentations for own alliance
CREATE POLICY "r5_create_presentations" ON alliance_presentations
  FOR INSERT WITH CHECK (
    is_superadmin()
    OR (
      get_user_role() = 'r5'
      AND generated_by = auth.uid()
      AND alliance_id = get_user_alliance_id()
    )
  );
