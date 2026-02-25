-- =====================================================
-- Contact form submissions (public inbound messages)
-- =====================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  email TEXT NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 255),
  topic TEXT NOT NULL DEFAULT 'general' CHECK (topic IN ('general', 'alliance', 'support', 'bug', 'partnership')),
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 10 AND 4000),
  source_path TEXT NOT NULL DEFAULT '/contact' CHECK (char_length(source_path) <= 200),
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created_at ON contact_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ip_created_at ON contact_messages(ip_address, created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Access is API-driven via service role (no direct client access required)
