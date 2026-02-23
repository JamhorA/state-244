-- Enable public to insert migration applications (for the application form)
CREATE POLICY "Allow public to submit applications" ON migration_applications
FOR INSERT TO public
WITH CHECK (true);

-- Allow public to view their own submitted applications (optional, for status checking)
CREATE POLICY "Allow public to view applications" ON migration_applications
FOR SELECT TO public
USING (true);
