-- =====================================================
-- State 244 Hub - Initial Database Schema
-- =====================================================

-- Enums
CREATE TYPE recruitment_status AS ENUM ('open', 'closed', 'invite_only');
CREATE TYPE application_status AS ENUM ('submitted', 'reviewing', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('member', 'r4', 'r5');
CREATE TYPE ai_image_type AS ENUM ('banner', 'emblem', 'logo_draft');
CREATE TYPE resource_type AS ENUM ('application_submit', 'ai_image_generate');

-- =====================================================
-- Tables
-- =====================================================

-- Alliances table (Top 3 alliances only)
CREATE TABLE alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  rank INTEGER NOT NULL UNIQUE CHECK (rank >= 1 AND rank <= 3),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  recruitment_status recruitment_status NOT NULL DEFAULT 'open',
  contact_info TEXT CHECK (char_length(contact_info) <= 500),
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) <= 50),
  hq_level INTEGER NOT NULL CHECK (hq_level >= 1 AND hq_level <= 50),
  power BIGINT NOT NULL CHECK (power >= 0),
  notes TEXT CHECK (char_length(notes) <= 500),
  role user_role NOT NULL DEFAULT 'member',
  alliance_id UUID REFERENCES alliances(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT single_r5_per_alliance UNIQUE (alliance_id) DEFERRABLE INITIALLY DEFERRED
);

-- Migration Applications table
CREATE TABLE migration_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL CHECK (char_length(player_name) <= 50),
  current_server TEXT NOT NULL CHECK (char_length(current_server) <= 100),
  power_level BIGINT NOT NULL CHECK (power_level >= 0),
  hq_level INTEGER NOT NULL CHECK (hq_level >= 1 AND hq_level <= 50),
  target_alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL CHECK (char_length(motivation) >= 10 AND char_length(motivation) <= 1000),
  status application_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Chat Messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT CHECK (char_length(content) <= 5000),
  image_url TEXT,
  room_name TEXT NOT NULL DEFAULT 'state-244-diplomacy' CHECK (room_name = 'state-244-diplomacy'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

-- AI Generated Images table
CREATE TABLE ai_generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alliance_id UUID REFERENCES alliances(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  prompt TEXT NOT NULL CHECK (char_length(prompt) >= 5 AND char_length(prompt) <= 1000),
  image_type ai_image_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Alliance Presentations table
CREATE TABLE alliance_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bullet_points JSONB NOT NULL CHECK (jsonb_array_length(bullet_points) > 0),
  tone TEXT NOT NULL CHECK (tone IN ('formal', 'casual', 'enthusiastic', 'professional')),
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Rate Limits table
CREATE TABLE rate_limits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT CHECK (char_length(ip_address) <= 45),
  resource_type resource_type NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count >= 1),
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_resource_window UNIQUE (user_id, ip_address, resource_type, window_start),
  CONSTRAINT either_user_or_ip CHECK (
    (user_id IS NOT NULL AND ip_address IS NULL) OR
    (user_id IS NULL AND ip_address IS NOT NULL)
  )
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_alliances_rank ON alliances(rank);
CREATE INDEX idx_profiles_alliance ON profiles(alliance_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_applications_status ON migration_applications(status);
CREATE INDEX idx_applications_alliance ON migration_applications(target_alliance_id, status);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_name, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_ai_images_user ON ai_generated_images(user_id, created_at DESC);
CREATE INDEX idx_rate_limits_window ON rate_limits(user_id, ip_address, resource_type, window_start);

-- =====================================================
-- Triggers
-- =====================================================

-- Updated At Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_alliances_updated_at
  BEFORE UPDATE ON alliances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON migration_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enforce Single R5 Per Alliance
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
$$ language 'plpgsql';

CREATE TRIGGER enforce_single_r5_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_single_r5();

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_presentations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Public can read alliances
CREATE POLICY "alliances_public_read" ON alliances
  FOR SELECT USING (true);

-- Public can read R5 profiles (for alliance leadership display)
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (role = 'r5');

-- Members can read their own profile
CREATE POLICY "profiles_member_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Members can read chat messages
CREATE POLICY "chat_messages_member_read" ON chat_messages
  FOR SELECT USING (true);

-- Members can create chat messages
CREATE POLICY "chat_messages_member_create" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Public can create migration applications
CREATE POLICY "applications_public_create" ON migration_applications
  FOR INSERT WITH CHECK (true);

-- R4 can read applications for their alliance
CREATE POLICY "applications_r4_read" ON migration_applications
  FOR SELECT USING (
    target_alliance_id IN (
      SELECT alliance_id FROM profiles WHERE id = auth.uid()
    )
  );

-- R4 can update application status
CREATE POLICY "applications_r4_update" ON migration_applications
  FOR UPDATE USING (
    target_alliance_id IN (
      SELECT alliance_id FROM profiles WHERE id = auth.uid() AND role IN ('r4', 'r5')
    )
  );

-- R5 can edit alliance data
CREATE POLICY "alliances_r5_edit" ON alliances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'r5'
      AND profiles.alliance_id = alliances.id
    )
  );

-- R5 can manage member roles
CREATE POLICY "profiles_r5_manage" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'r5'
      AND p1.alliance_id = profiles.alliance_id
    )
  );

-- R4 can read alliance presentations
CREATE POLICY "presentations_r4_read" ON alliance_presentations
  FOR SELECT USING (
    alliance_id IN (
      SELECT alliance_id FROM profiles WHERE id = auth.uid() AND role IN ('r4', 'r5')
    )
  );

-- R5 can create alliance presentations
CREATE POLICY "presentations_r5_create" ON alliance_presentations
  FOR INSERT WITH CHECK (
    generated_by = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'r5'
  );

-- Members can read their own generated images
CREATE POLICY "ai_images_member_read_own" ON ai_generated_images
  FOR SELECT USING (user_id = auth.uid());

-- Members can create generated images
CREATE POLICY "ai_images_member_create" ON ai_generated_images
  FOR INSERT WITH CHECK (user_id = auth.uid());
