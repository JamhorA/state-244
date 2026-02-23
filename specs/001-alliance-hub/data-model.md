# Data Model: State 244 Hub – MVP

**Feature**: [spec.md](./spec.md)
**Date**: 2026-02-20
**Phase**: 1 - Design & Contracts

## Overview

This document defines the data model for State 244 Hub MVP, including entities, relationships, validation rules, and state transitions. The model is designed for PostgreSQL with Supabase Row Level Security (RLS) for role-based access control.

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   auth.users │─────────>│     profiles     │─────────>│      alliances      │
│             │ 1:1    │                  │ N:1     │                     │
└─────────────┘         └──────────────────┘         └─────────────────────┘
                                                         │
                                                         │ 1:N
                                                         ▼
                                          ┌──────────────────────────┐
                                          │ migration_applications │
                                          └──────────────────────────┘

┌─────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│   auth.users │─────────>│     profiles     │─────────>│      chat_messages   │
│             │ 1:1    │                  │ 1:N     │                     │
└─────────────┘         └──────────────────┘         └─────────────────────┘
                                                         │
                                                         │ 1:1
                                                         ▼
                                          ┌──────────────────────────┐
                                          │   ai_generated_images   │
                                          └──────────────────────────┘
```

---

## Entities

### 1. `auth.users` (Supabase Auth)

**Description**: Built-in Supabase authentication table. Extended via `profiles` table.

**Fields** (Supabase managed):
- `id`: UUID (Primary Key)
- `email`: TEXT (Unique, indexed)
- `encrypted_password`: TEXT
- `email_confirmed_at`: TIMESTAMP
- `created_at`: TIMESTAMP
- `last_sign_in_at`: TIMESTAMP
- `raw_user_meta_data`: JSONB

**Validation**: Email format, password strength (Supabase defaults)

**Constraints**: Email must be unique

---

### 2. `profiles`

**Description**: Extended user information including role and alliance association.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK to `auth.users.id` | User identifier |
| `display_name` | TEXT | NOT NULL, max 50 chars | User's display name |
| `hq_level` | INTEGER | NOT NULL, >= 1, <= 50 | Player's HQ level |
| `power` | BIGINT | NOT NULL, >= 0 | Player's power level |
| `notes` | TEXT | NULL, max 500 chars | Optional user notes |
| `role` | `user_role` | NOT NULL, DEFAULT 'member' | User's role in system |
| `alliance_id` | UUID | NULL, FK to `alliances.id` | User's alliance (optional) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Profile creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- `hq_level`: Must be between 1 and 50 (game constraint)
- `power`: Must be non-negative
- `role`: Must be one of: 'member', 'r4', 'r5'
- `alliance_id`: If not NULL, must reference existing alliance

**Constraints**:
- One profile per user (1:1 with `auth.users`)
- Only one R5 per alliance (enforced via trigger or application logic)

---

### 3. `alliances`

**Description**: Gaming alliances, MVP limited to Top 3.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Alliance identifier |
| `name` | TEXT | NOT NULL, UNIQUE, max 100 chars | Alliance name |
| `rank` | INTEGER | NOT NULL, >= 1, <= 3, UNIQUE | Alliance rank (Top 3 only) |
| `description` | TEXT | NOT NULL, max 2000 chars | Public description |
| `recruitment_status` | `recruitment_status` | NOT NULL, DEFAULT 'open' | Recruitment status |
| `contact_info` | TEXT | NULL, max 500 chars | Public contact information |
| `logo_url` | TEXT | NULL, valid URL | Alliance logo image URL |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Enums**:
```sql
CREATE TYPE recruitment_status AS ENUM ('open', 'closed', 'invite_only');
```

**Validation Rules**:
- `rank`: Must be 1, 2, or 3 (MVP: Top 3 only)
- `name`: Must be unique
- `logo_url`: If provided, must be valid HTTPS URL to public bucket

**Constraints**:
- Exactly 3 alliances with ranks 1, 2, 3

---

### 4. `migration_applications`

**Description**: Applications from external players to join alliances.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Application identifier |
| `player_name` | TEXT | NOT NULL, max 50 chars | Player's in-game name |
| `current_server` | TEXT | NOT NULL, max 100 chars | Current server name |
| `power_level` | BIGINT | NOT NULL, >= 0 | Player's power level |
| `hq_level` | INTEGER | NOT NULL, >= 1, <= 50 | Player's HQ level |
| `target_alliance_id` | UUID | NOT NULL, FK to `alliances.id` | Target alliance (Top 3 only) |
| `motivation` | TEXT | NOT NULL, max 1000 chars | Player's motivation |
| `status` | `application_status` | NOT NULL, DEFAULT 'submitted' | Application status |
| `submitted_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Submission timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last status update timestamp |
| `reviewed_by` | UUID | NULL, FK to `profiles.id` | R4/R5 who reviewed |

**Enums**:
```sql
CREATE TYPE application_status AS ENUM (
  'submitted',
  'reviewing',
  'approved',
  'rejected'
);
```

**Validation Rules**:
- `power_level`: Must be non-negative
- `hq_level`: Must be between 1 and 50
- `target_alliance_id`: Must reference alliance with rank 1-3 (Top 3 only)
- `motivation`: Minimum 10 characters (to prevent spam)

**State Transitions**:
```
submitted → reviewing → approved
                  ↘ rejected
```

**Constraints**:
- `target_alliance_id`: Must be one of Top 3 alliances (enforced via CHECK or FK to filtered view)

---

### 5. `chat_messages`

**Description**: Messages in the global "State 244 Diplomacy" chat room.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Message identifier |
| `sender_id` | UUID | NOT NULL, FK to `auth.users.id` | Message sender |
| `content` | TEXT | NULL, max 5000 chars | Message text content |
| `image_url` | TEXT | NULL, valid URL | Attached image URL |
| `room_name` | TEXT | NOT NULL, DEFAULT 'state-244-diplomacy' | Chat room name |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Message timestamp |

**Validation Rules**:
- Must have either `content` OR `image_url` (or both)
- `content`: If provided, max 5000 characters
- `image_url`: If provided, must be valid HTTPS URL to storage bucket
- `room_name`: Must be 'state-244-diplomacy' (MVP: single room only)

**Constraints**:
- `sender_id`: Must reference authenticated user (RLS enforced)
- `image_url`: Must reference private storage bucket

---

### 6. `ai_generated_images`

**Description**: AI-generated images for internal alliance use.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Image identifier |
| `user_id` | UUID | NOT NULL, FK to `auth.users.id` | User who generated |
| `alliance_id` | UUID | NULL, FK to `alliances.id` | Associated alliance |
| `image_url` | TEXT | NOT NULL, valid URL | Image URL (private bucket) |
| `prompt` | TEXT | NOT NULL, max 1000 chars | AI generation prompt |
| `image_type` | `ai_image_type` | NOT NULL | Image type |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Generation timestamp |

**Enums**:
```sql
CREATE TYPE ai_image_type AS ENUM ('banner', 'emblem', 'logo_draft');
```

**Validation Rules**:
- `prompt`: Minimum 5 characters
- `image_url`: Must be valid HTTPS URL to private storage bucket
- `image_type`: Must be one of: 'banner', 'emblem', 'logo_draft'

**Constraints**:
- Internal only: Never accessible via public URLs (enforced via RLS)
- Rate limiting: 5 images per user per day (enforced via `rate_limits` table)

---

### 7. `rate_limits`

**Description**: Rate limiting tracker for spam prevention and AI quotas.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Counter identifier |
| `user_id` | UUID | NULL, FK to `auth.users.id` | Authenticated user |
| `ip_address` | TEXT | NULL, max 45 chars (IPv6) | IP address for unauthenticated |
| `resource_type` | `resource_type` | NOT NULL | Resource being limited |
| `request_count` | INTEGER | NOT NULL, DEFAULT 1 | Number of requests |
| `window_start` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Rate limit window start |

**Enums**:
```sql
CREATE TYPE resource_type AS ENUM (
  'application_submit',
  'ai_image_generate'
);
```

**Validation Rules**:
- Either `user_id` OR `ip_address` must be set (never both)
- `request_count`: Must be positive

**Constraints**:
- Unique constraint: `(user_id, ip_address, resource_type, window_start)`

**Rate Limits**:
- `application_submit`: 10 requests per IP per hour (public form)
- `ai_image_generate`: 5 requests per user per day (AI image generation)

---

### 8. `alliance_presentations` (AI-Generated Text)

**Description**: AI-generated alliance presentation text drafts.

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Presentation identifier |
| `alliance_id` | UUID | NOT NULL, FK to `alliances.id` | Associated alliance |
| `generated_by` | UUID | NOT NULL, FK to `auth.users.id` | R4/R5 who generated |
| `bullet_points` | JSONB | NOT NULL | Source bullet points |
| `tone` | TEXT | NOT NULL | Selected tone |
| `content` | TEXT | NOT NULL, max 5000 chars | Generated content |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT false | Whether published to public profile |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Generation timestamp |
| `reviewed_at` | TIMESTAMP | NULL | Human review timestamp |

**Validation Rules**:
- `bullet_points`: Must be non-empty JSON array
- `tone`: Must be one of: 'formal', 'casual', 'enthusiastic', 'professional'
- `content`: Must be non-empty

**Constraints**:
- Only R4/R5 can generate (enforced via RLS)
- Human review required before `is_published = true`

---

## Row Level Security (RLS) Policies

### Public Access (Unauthenticated)

```sql
-- Enable RLS
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_presentations ENABLE ROW LEVEL SECURITY;

-- Public can read alliances (Top 3)
CREATE POLICY "alliances_public_read" ON alliances
  FOR SELECT USING (true);

-- Public can read top 3 alliance profiles only
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT USING (role = 'r5');

-- Public can create migration applications
CREATE POLICY "applications_public_create" ON migration_applications
  FOR INSERT WITH CHECK (true);
```

### Authenticated Access (Members)

```sql
-- Members can read their own profile
CREATE POLICY "profiles_member_read_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Members can read chat messages
CREATE POLICY "chat_messages_member_read" ON chat_messages
  FOR SELECT USING (true);

-- Members can create chat messages
CREATE POLICY "chat_messages_member_create" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Members can read their own generated images
CREATE POLICY "ai_images_member_read_own" ON ai_generated_images
  FOR SELECT USING (user_id = auth.uid());

-- Members can create generated images (rate limited in application)
CREATE POLICY "ai_images_member_create" ON ai_generated_images
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### R4 Access (Officers)

```sql
-- R4 can read applications for their alliance
CREATE POLICY "applications_r4_read" ON migration_applications
  FOR SELECT USING (
    profiles.alliance_id = (
      SELECT alliance_id FROM profiles WHERE id = auth.uid()
    )
  );

-- R4 can update application status
CREATE POLICY "applications_r4_update" ON migration_applications
  FOR UPDATE USING (
    profiles.alliance_id = (
      SELECT alliance_id FROM profiles WHERE id = auth.uid()
    )
    AND profiles.role = 'r4'
  );

-- R4 can read alliance presentations
CREATE POLICY "presentations_r4_read" ON alliance_presentations
  FOR SELECT USING (
    alliance_id = (
      SELECT alliance_id FROM profiles WHERE id = auth.uid()
    )
  );
```

### R5 Access (Leaders)

```sql
-- R5 can update alliance data
CREATE POLICY "alliances_r5_edit" ON alliances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'r5'
      AND profiles.alliance_id = alliances.id
    )
  );

-- R5 can manage member roles (within alliance)
CREATE POLICY "profiles_r5_manage" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'r5'
      AND p1.alliance_id = profiles.alliance_id
    )
  );

-- R5 can create alliance presentations
CREATE POLICY "presentations_r5_create" ON alliance_presentations
  FOR INSERT WITH CHECK (
    generated_by = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'r5'
  );
```

---

## Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_alliances_rank ON alliances(rank);
CREATE INDEX idx_profiles_alliance ON profiles(alliance_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_applications_status ON migration_applications(status);
CREATE INDEX idx_applications_alliance ON migration_applications(target_alliance_id, status);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_name, created_at DESC);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_ai_images_user ON ai_generated_images(user_id, created_at DESC);
CREATE INDEX idx_rate_limits_window ON rate_limits(user_id, ip_address, resource_type, window_start);
```

---

## Triggers

### Updated At Timestamps

```sql
-- Update updated_at on change
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
```

### Single R5 Per Alliance

```sql
-- Enforce one R5 per alliance
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
```

---

## Summary

| Entity | Public Read | Auth Read | R4 Read/Write | R5 Read/Write |
|--------|-------------|-------------|----------------|----------------|
| `alliances` | ✅ | ✅ | ✅ | ✅ (own) |
| `profiles` | Partial | ✅ (own) | ✅ (alliance) | ✅ (alliance) |
| `migration_applications` | ❌ | ❌ | ✅ (alliance) | ✅ (alliance) |
| `chat_messages` | ❌ | ✅ | ✅ | ✅ |
| `ai_generated_images` | ❌ | ✅ (own) | ✅ (alliance) | ✅ (alliance) |
| `alliance_presentations` | ❌ | ❌ | ✅ (alliance) | ✅ (create) |
| `rate_limits` | ❌ | ❌ | ❌ | ❌ (app only) |
