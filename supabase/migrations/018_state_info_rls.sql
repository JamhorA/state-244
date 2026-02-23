-- Enable RLS on state_info table and allow public read access
ALTER TABLE state_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to read state_info" ON state_info
FOR SELECT TO public
USING (is_active = true);
