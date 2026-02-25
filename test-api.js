const body = {
  player_name: "TestPlayer",
  current_server: "State 250",
  current_alliance: "[TEST] Alphas",
  power_level: 100000000,
  hq_level: 30,
  troop_level: "T10",
  arena_power: "4,500,000",
  duel_points: "Up to 50m",
  svs_participation: "Yes",
  target_alliance_id: "11111111-1111-1111-1111-111111111111",
  motivation: "This is a test motivation text. At least 10 chars.",
  screenshots: ["https://example.com/test.png"]
};

fetch('http://localhost:3000/api/applications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
