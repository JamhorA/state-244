const { execSync } = require('child_process');
const output = execSync('npx supabase psql -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'migration_applications\';"');
console.log(output.toString());
