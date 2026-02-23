-- Create table for State 244 information
CREATE TABLE state_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial sections
INSERT INTO state_info (section_key, title, content, display_order) VALUES
('story', 'The Story of State 244', 'Every state has a beginning. State 244 opened its gates and welcomed warriors from across the world. What started as empty land soon became a battlefield of epic proportions.

Three great alliances rose to power, each with their own vision, their own strength, their own story. They fought for dominance. They forged alliances. They built empires.

But State 244 is more than just war. It is a community. A place where players from every corner of the globe come together to compete, cooperate, and create memories that last a lifetime.

This is our home. This is our story. And it is still being written.

Will you be part of it?', 1),

('rules', 'State 244 Rules & Guidelines', 'COMMUNITY STANDARDS

All players are expected to treat each other with respect. Trash talk is part of the game, but personal attacks, harassment, and discrimination will not be tolerated.

DIPLOMACY PROTOCOLS

Alliances are encouraged to establish diplomatic relations. NAPs (Non-Aggression Pacts) and alliances should be honored. Breaking diplomatic agreements without cause damages the reputation of your alliance.

FAIR PLAY

Cheating, exploitation of bugs, and use of unauthorized third-party tools is strictly prohibited. Play fair, play hard.

MIGRATION RULES

Players wishing to migrate to State 244 should submit applications through official channels. Each alliance has their own recruitment process and standards.

COMMUNICATION

Use official channels for alliance communication. Keep diplomacy discussions professional. Remember that your words represent your alliance.', 2),

('server_info', 'Server Information', 'STATE NUMBER: 244

STATE AGE: Active since launch

TOP ALLIANCES: 3 major powers compete for dominance

PRIMARY LANGUAGE: English (international community welcome)

EVENT PARTICIPATION: All major State of Survival events are active

CROSS-STATE EVENTS: Regular SvS (State vs State) competitions

COMMUNITY: Active Discord and in-game chat

TIME ZONE: Global - members from all regions

RECRUITMENT: All top alliances are actively recruiting qualified players', 3);

-- Create index for ordering
CREATE INDEX idx_state_info_order ON state_info(display_order);
