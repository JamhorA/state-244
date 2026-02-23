-- Allow authenticated users to create and edit their own profile.
-- Required for first-login profile bootstrap from the app.

DROP POLICY IF EXISTS "profiles_member_insert_own" ON profiles;
CREATE POLICY "profiles_member_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_member_update_own" ON profiles;
CREATE POLICY "profiles_member_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
