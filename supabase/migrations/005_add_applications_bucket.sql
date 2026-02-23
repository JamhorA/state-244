-- Create an applications storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('applications', 'applications', true) ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the applications bucket
CREATE POLICY "Allow public uploads to applications" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'applications');
CREATE POLICY "Allow public viewing of applications" ON storage.objects FOR SELECT TO public USING (bucket_id = 'applications');
