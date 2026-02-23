-- Update seeded alliance names to requested ranking:
-- Rank 1: 300s, Rank 2: Hits, Rank 3: Rage

UPDATE alliances
SET
  name = CASE rank
    WHEN 1 THEN '300s'
    WHEN 2 THEN 'Hits'
    WHEN 3 THEN 'Rage'
    ELSE name
  END,
  description = CASE rank
    WHEN 1 THEN 'Top alliance in State 244 focused on high-activity wars, coordination, and elite performance.'
    WHEN 2 THEN 'Second-ranked alliance known for aggressive rallies and strong event consistency.'
    WHEN 3 THEN 'Third-ranked alliance with a competitive core and disciplined migration onboarding.'
    ELSE description
  END,
  contact_info = CASE rank
    WHEN 1 THEN 'Diplomacy lead: 300s R5'
    WHEN 2 THEN 'Contact Hits leadership in diplomacy chat'
    WHEN 3 THEN 'Contact Rage officers for openings'
    ELSE contact_info
  END,
  updated_at = NOW()
WHERE rank IN (1, 2, 3);
