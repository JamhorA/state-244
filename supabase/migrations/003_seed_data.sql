-- =====================================================
-- State 244 Hub - Seed Data
-- Idempotent inserts for local/dev/staging bootstrap.
-- =====================================================

-- Alliances (Top 3)
INSERT INTO alliances (
  id, name, rank, description, recruitment_status, contact_info, logo_url, created_at, updated_at
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '300s',
    1,
    'Top alliance in State 244 focused on high-activity wars, coordination, and elite performance.',
    'open',
    'Diplomacy lead: 300s R5',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Hits',
    2,
    'Second-ranked alliance known for aggressive rallies and strong event consistency.',
    'invite_only',
    'Contact Hits leadership in diplomacy chat',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Rage',
    3,
    'Third-ranked alliance with a competitive core and disciplined migration onboarding.',
    'closed',
    'Contact Rage officers for openings',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  rank = EXCLUDED.rank,
  description = EXCLUDED.description,
  recruitment_status = EXCLUDED.recruitment_status,
  contact_info = EXCLUDED.contact_info,
  logo_url = EXCLUDED.logo_url,
  updated_at = NOW();

-- Profiles for existing auth users (if any)
INSERT INTO profiles (
  id, display_name, hq_level, power, notes, role, alliance_id, created_at, updated_at
)
SELECT
  u.id,
  LEFT(COALESCE(NULLIF(u.raw_user_meta_data->>'display_name', ''), SPLIT_PART(u.email, '@', 1), 'Member'), 50),
  1,
  0,
  'Auto-seeded profile',
  'member'::user_role,
  NULL,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- Promote first user to R5 in Alliance #1 and second user to R4 in same alliance (if present)
WITH ranked_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM profiles
)
UPDATE profiles p
SET
  role = CASE
    WHEN rp.rn = 1 THEN 'r5'::user_role
    WHEN rp.rn = 2 THEN 'r4'::user_role
    ELSE p.role
  END,
  alliance_id = CASE
    WHEN rp.rn IN (1, 2) THEN '11111111-1111-1111-1111-111111111111'::uuid
    ELSE p.alliance_id
  END,
  updated_at = NOW()
FROM ranked_profiles rp
WHERE p.id = rp.id
  AND rp.rn IN (1, 2);

-- Migration Applications
INSERT INTO migration_applications (
  id, player_name, current_server, power_level, hq_level, target_alliance_id, motivation, status, submitted_at, updated_at, reviewed_by
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'SkyMarshal',
    'State 237',
    987654321,
    34,
    '11111111-1111-1111-1111-111111111111',
    'Looking for an organized war-focused alliance with active rally scheduling and long-term growth.',
    'submitted'::application_status,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NULL
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'NovaBlade',
    'State 241',
    654321000,
    30,
    '22222222-2222-2222-2222-222222222222',
    'Interested in joining a mature alliance with clear leadership and coordinated event participation.',
    'reviewing'::application_status,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '10 hours',
    NULL
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'RiftPilot',
    'State 229',
    412300000,
    28,
    '33333333-3333-3333-3333-333333333333',
    'Seeking stable alliance culture and a long-term home after migration.',
    'approved'::application_status,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days',
    NULL
  )
ON CONFLICT (id) DO UPDATE
SET
  player_name = EXCLUDED.player_name,
  current_server = EXCLUDED.current_server,
  power_level = EXCLUDED.power_level,
  hq_level = EXCLUDED.hq_level,
  target_alliance_id = EXCLUDED.target_alliance_id,
  motivation = EXCLUDED.motivation,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Chat Messages (seed only if at least one user exists)
INSERT INTO chat_messages (id, sender_id, content, image_url, room_name, created_at)
SELECT
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  p.id,
  'Welcome to State 244 diplomacy channel. Please keep alliance discussions coordinated and respectful.',
  NULL,
  'state-244-diplomacy',
  NOW() - INTERVAL '6 hours'
FROM profiles p
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO chat_messages (id, sender_id, content, image_url, room_name, created_at)
SELECT
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
  p.id,
  'Daily diplomacy sync starts in 30 minutes. Bring migration updates and NAP status.',
  NULL,
  'state-244-diplomacy',
  NOW() - INTERVAL '2 hours'
FROM profiles p
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- AI Generated Images (seed only if at least one user exists)
INSERT INTO ai_generated_images (id, user_id, alliance_id, image_url, prompt, image_type, created_at)
SELECT
  'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1'::uuid,
  p.id,
  p.alliance_id,
  'https://example.com/seed-banner.png',
  'Alliance war banner with steel wings and blue energy accents',
  'banner'::ai_image_type,
  NOW() - INTERVAL '12 hours'
FROM profiles p
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  alliance_id = EXCLUDED.alliance_id,
  image_url = EXCLUDED.image_url,
  prompt = EXCLUDED.prompt,
  image_type = EXCLUDED.image_type;

-- Alliance Presentation (seed only if an R5 exists)
INSERT INTO alliance_presentations (
  id, alliance_id, generated_by, bullet_points, tone, content, is_published, created_at, reviewed_at
)
SELECT
  'abababab-abab-abab-abab-abababababab'::uuid,
  COALESCE(p.alliance_id, '11111111-1111-1111-1111-111111111111'::uuid),
  p.id,
  '["Top 10 war performance in the region","Structured event participation","Experienced rally leaders","Active migration support"]'::jsonb,
  'professional',
  'Aegis Vanguard is recruiting disciplined players for competitive growth. We provide coordinated war strategy, active leadership, and a stable alliance culture focused on long-term progression.',
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '20 hours'
FROM profiles p
WHERE p.role = 'r5'
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET
  alliance_id = EXCLUDED.alliance_id,
  generated_by = EXCLUDED.generated_by,
  bullet_points = EXCLUDED.bullet_points,
  tone = EXCLUDED.tone,
  content = EXCLUDED.content,
  is_published = EXCLUDED.is_published,
  reviewed_at = EXCLUDED.reviewed_at;

-- Rate limits (IP-based examples; no user dependency)
INSERT INTO rate_limits (user_id, ip_address, resource_type, request_count, window_start)
VALUES
  (NULL, '192.168.48.10', 'application_submit'::resource_type, 2, NOW() - INTERVAL '10 minutes'),
  (NULL, '192.168.48.11', 'ai_image_generate'::resource_type, 1, NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;
