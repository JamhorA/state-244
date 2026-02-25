-- =====================================================
-- War Plan Phase 1 (Glory War roster + draft assignments)
-- =====================================================

-- Alliance-linked roster entries for planning (not tied to auth accounts)
CREATE TABLE IF NOT EXISTS war_roster_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL CHECK (char_length(trim(player_name)) BETWEEN 1 AND 50),
  linked_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT CHECK (char_length(notes) <= 250),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT war_roster_players_unique_name_per_alliance UNIQUE (alliance_id, player_name)
);

-- One plan row per alliance + mode (phase 1 uses glory_war only)
CREATE TABLE IF NOT EXISTS war_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('glory_war', 'canyon_clash', 'svs', 'arctic_ice_pit_clash')),
  title TEXT NOT NULL DEFAULT 'Glory War Plan' CHECK (char_length(title) <= 100),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT war_plans_unique_alliance_mode UNIQUE (alliance_id, mode)
);

CREATE TABLE IF NOT EXISTS war_plan_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES war_plans(id) ON DELETE CASCADE,
  roster_player_id UUID NOT NULL REFERENCES war_roster_players(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('attacker', 'defender')),
  position INTEGER NOT NULL CHECK (position >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT war_plan_assignments_unique_player UNIQUE (plan_id, roster_player_id),
  CONSTRAINT war_plan_assignments_unique_position UNIQUE (plan_id, team, position)
);

CREATE INDEX IF NOT EXISTS idx_war_roster_players_alliance ON war_roster_players(alliance_id, is_active, player_name);
CREATE INDEX IF NOT EXISTS idx_war_plans_alliance_mode ON war_plans(alliance_id, mode);
CREATE INDEX IF NOT EXISTS idx_war_plan_assignments_plan_team ON war_plan_assignments(plan_id, team, position);

-- Keep timestamps current using existing trigger function
DROP TRIGGER IF EXISTS update_war_roster_players_updated_at ON war_roster_players;
CREATE TRIGGER update_war_roster_players_updated_at
  BEFORE UPDATE ON war_roster_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_war_plans_updated_at ON war_plans;
CREATE TRIGGER update_war_plans_updated_at
  BEFORE UPDATE ON war_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE war_roster_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_plan_assignments ENABLE ROW LEVEL SECURITY;

-- Access is API-driven via service role (no direct client table access required yet)
