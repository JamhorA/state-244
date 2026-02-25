import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('migration_applications')
    .insert([
      {
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
        screenshots: ["https://example.com/test.png"],
        status: 'submitted',
      }
    ])
    .select();
    
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
