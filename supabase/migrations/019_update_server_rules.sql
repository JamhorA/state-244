-- Update State 244 rules with official server rules
UPDATE state_info
SET 
  content = 'SERVER 244 — OFFICIAL RULES

HQ HP

No attacking walls under 20,000 HP

Final hit must keep HQ above 15,000 HP (below is a violation)

LEAVING THE HIVE

At your own risk — no protection

PLUNDERING

Solo only (No group farming)

Reinforcement allowed without teleport

One HQ access per alliance per hive

HARASSMENT

Repeated raids on the same target by the same alliance = harassment

Verified by resource reports

HOLIDAY RULE

Personal raids for personal gain forbidden

Alliance vs alliance wars allowed if contained

City attacks = formal war declaration

FARM ACCOUNTS

Safe Farm Alliances (S2): 244S / 244H / 244R

Labeled 244 + letter (ex: 244S)

No raids on NAP 0

Only owner may plunder

SOULS & SAPPHIRE

Season 2 first-come, first-served (excluding Lv.14 & 15)

No attacking claimed tiles

(Subject to change after city occupation is completed)

ARENA

One attack per target (Server 244)

2+ attacks = violation

Always active

MINE

Fully open — no restrictions

TRUCKS

Do not raid 244 trucks

SvS only: plunder opposing server

Send weaker trucks, send 8+ hours after reset

PENALTIES

Verified via battle reports & alliance logs

Case-by-case

Alliance leaders first, state leaders mediate

Non-compliance may result in Capital war

PERMANENT SANCTIONS

Evading punishment or repeat misconduct = Server Outlaw

Sheltering an outlaw = enemy of the server',
  updated_at = NOW()
WHERE section_key = 'rules';
