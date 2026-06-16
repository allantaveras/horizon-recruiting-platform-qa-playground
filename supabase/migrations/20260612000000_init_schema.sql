-- Create Supabase default roles if they do not exist in vanilla Postgres
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  ELSE
    ALTER ROLE service_role BYPASSRLS;
  END IF;
END
$$;

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create compatibility operators between UUID and TEXT for older GoTrue migrations
CREATE OR REPLACE FUNCTION public.uuid_eq_text(uuid, text)
RETURNS boolean AS $$
  SELECT $1 = $2::uuid;
$$ LANGUAGE sql IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION public.text_eq_uuid(text, uuid)
RETURNS boolean AS $$
  SELECT $1::uuid = $2;
$$ LANGUAGE sql IMMUTABLE STRICT;

DROP OPERATOR IF EXISTS = (uuid, text);
DROP OPERATOR IF EXISTS = (text, uuid);

CREATE OPERATOR = (
  LEFTARG = uuid,
  RIGHTARG = text,
  PROCEDURE = public.uuid_eq_text,
  COMMUTATOR = =
);

CREATE OPERATOR = (
  LEFTARG = text,
  RIGHTARG = uuid,
  PROCEDURE = public.text_eq_uuid,
  COMMUTATOR = =
);

-- Grant standard permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Create tables in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Recruiter', 'Viewer')) DEFAULT 'Viewer',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sync profiles with auth users metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Viewer')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin TEXT,
  resume_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected')) DEFAULT 'Applied',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  changed_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create audit webhooks table
CREATE TABLE IF NOT EXISTS public.audit_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  target_url TEXT NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to get the role of the current user
-- Decoupled from auth schema references by extracting claims directly from settings
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = (nullif(current_setting('request.jwt.claim.sub', true), '')::uuid);
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_webhooks ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow read access to authenticated profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to manage profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'Admin')
  WITH CHECK (public.get_my_role() = 'Admin');

-- Candidates Policies
CREATE POLICY "Allow read access to candidates for all roles"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow Admin and Recruiter to insert candidates"
  ON public.candidates FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('Admin', 'Recruiter'));

CREATE POLICY "Allow Admin and Recruiter to update candidates"
  ON public.candidates FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('Admin', 'Recruiter'))
  WITH CHECK (public.get_my_role() IN ('Admin', 'Recruiter'));

CREATE POLICY "Allow Admin to delete candidates"
  ON public.candidates FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'Admin');

-- Audit Logs Policies
CREATE POLICY "Allow Admin and Recruiter to select audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('Admin', 'Recruiter'));

CREATE POLICY "Allow insertions by system service role"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Audit Webhooks Policies
CREATE POLICY "Allow Admin and Recruiter to select webhooks history"
  ON public.audit_webhooks FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('Admin', 'Recruiter'));

CREATE POLICY "Allow insertions by system service role"
  ON public.audit_webhooks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Store procedure to reset the database during E2E tests
CREATE OR REPLACE FUNCTION public.reset_test_database()
RETURNS VOID AS $$
BEGIN
  -- Dynamically create trigger if auth.users exists (called during runtime reset)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
      EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
    END IF;

    -- Reset auth users (keeping the seed users) via dynamic SQL to bypass schema checks during init
    EXECUTE 'DELETE FROM auth.users WHERE email IN (''admin@recruiting.local'', ''recruiter@recruiting.local'', ''viewer@recruiting.local'')';
    
    -- Re-insert seed users into auth.users (password: 'password123') via dynamic SQL to bypass schema checks during init
    EXECUTE 'INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES
      (
        ''00000000-0000-0000-0000-000000000000'',
        ''a1111111-1111-1111-1111-111111111111'',
        '''',
        '''',
        ''admin@recruiting.local'',
        ''$2a$10$/DEhf8pSNKjf6HnQoI5znODoi18PwwA1DyRFqxd5plvLu13srDhXC'',
        now(),
        ''{"provider": "email", "providers": ["email"]}'',
        ''{"role": "Admin"}'',
        false,
        now(),
        now(),
        '''',
        '''',
        '''',
        ''''
      ),
      (
        ''00000000-0000-0000-0000-000000000000'',
        ''b2222222-2222-2222-2222-222222222222'',
        '''',
        '''',
        ''recruiter@recruiting.local'',
        ''$2a$10$/DEhf8pSNKjf6HnQoI5znODoi18PwwA1DyRFqxd5plvLu13srDhXC'',
        now(),
        ''{"provider": "email", "providers": ["email"]}'',
        ''{"role": "Recruiter"}'',
        false,
        now(),
        now(),
        '''',
        '''',
        '''',
        ''''
      ),
      (
        ''00000000-0000-0000-0000-000000000000'',
        ''c3333333-3333-3333-3333-333333333333'',
        '''',
        '''',
        ''viewer@recruiting.local'',
        ''$2a$10$/DEhf8pSNKjf6HnQoI5znODoi18PwwA1DyRFqxd5plvLu13srDhXC'',
        now(),
        ''{"provider": "email", "providers": ["email"]}'',
        ''{"role": "Viewer"}'',
        false,
        now(),
        now(),
        '''',
        '''',
        '''',
        ''''
      )';

    -- Re-insert seed identities into auth.identities via dynamic SQL to bypass schema checks during init
    EXECUTE 'INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES
      (
        ''a1111111-1111-1111-1111-111111111111'',
        ''a1111111-1111-1111-1111-111111111111'',
        ''a1111111-1111-1111-1111-111111111111'',
        ''{"sub": "a1111111-1111-1111-1111-111111111111", "email": "admin@recruiting.local"}'',
        ''email'',
        now(),
        now(),
        now()
      ),
      (
        ''b2222222-2222-2222-2222-222222222222'',
        ''b2222222-2222-2222-2222-222222222222'',
        ''b2222222-2222-2222-2222-222222222222'',
        ''{"sub": "b2222222-2222-2222-2222-222222222222", "email": "recruiter@recruiting.local"}'',
        ''email'',
        now(),
        now(),
        now()
      ),
      (
        ''c3333333-3333-3333-3333-333333333333'',
        ''c3333333-3333-3333-3333-333333333333'',
        ''c3333333-3333-3333-3333-333333333333'',
        ''{"sub": "c3333333-3333-3333-3333-333333333333", "email": "viewer@recruiting.local"}'',
        ''email'',
        now(),
        now(),
        now()
      )';
  END IF;

  -- Truncate public tables
  DELETE FROM public.audit_logs;
  DELETE FROM public.audit_webhooks;
  DELETE FROM public.candidates;

  -- Reset profiles
  DELETE FROM public.profiles WHERE id IN ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333');

  -- Insert profiles
  INSERT INTO public.profiles (id, role, updated_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Admin', now()),
    ('b2222222-2222-2222-2222-222222222222', 'Recruiter', now()),
    ('c3333333-3333-3333-3333-333333333333', 'Viewer', now())
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

  -- Insert candidates
  INSERT INTO public.candidates (id, name, email, phone, linkedin, resume_url, status, notes, created_at, updated_at) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'John Doe', 'john.doe@example.com', '+1 (555) 123-4567', 'https://linkedin.com/in/johndoe', 'https://example.com/resumes/johndoe.pdf', 'Applied', 'Strong background in React and node.js. Needs screening call.', now() - interval '10 days', now() - interval '10 days'),
    ('c2222222-2222-2222-2222-222222222222', 'Jane Smith', 'jane.smith@example.com', '+1 (555) 987-6543', 'https://linkedin.com/in/janesmith', 'https://example.com/resumes/janesmith.pdf', 'Screening', 'Passed initial phone screen. Communication skills are excellent.', now() - interval '8 days', now() - interval '6 days'),
    ('c3333333-3333-3333-3333-333333333333', 'Alice Johnson', 'alice.j@example.com', '+1 (555) 456-7890', 'https://linkedin.com/in/alicejohnson', 'https://example.com/resumes/alicejohnson.pdf', 'Interview', 'Technical assessment complete. Onsite interviews scheduled for tomorrow.', now() - interval '12 days', now() - interval '4 days'),
    ('c4444444-4444-4444-4444-444444444444', 'Bob Brown', 'bob.brown@example.com', '+1 (555) 321-7654', 'https://linkedin.com/in/bobbrown', 'https://example.com/resumes/bobbrown.pdf', 'Offer', 'Offer package sent. Waiting for response. Base salary: $135k.', now() - interval '15 days', now() - interval '2 days'),
    ('c5555555-5555-5555-5555-555555555555', 'Charlie Green', 'charlie.g@example.com', '+1 (555) 789-0123', 'https://linkedin.com/in/charliegreen', 'https://example.com/resumes/charliegreen.pdf', 'Hired', 'Offer accepted! Start date set for next month. Background check complete.', now() - interval '20 days', now() - interval '1 day'),
    ('c6666666-6666-6666-6666-666666666666', 'David White', 'david.w@example.com', '+1 (555) 890-1234', 'https://linkedin.com/in/davidwhite', 'https://example.com/resumes/davidwhite.pdf', 'Rejected', 'Failed technical test. Rejection email sent.', now() - interval '5 days', now() - interval '3 days'),
    ('c7777777-7777-7777-7777-777777777777', 'Eva Black', 'eva.black@example.com', '+1 (555) 234-5678', 'https://linkedin.com/in/evablack', 'https://example.com/resumes/evablack.pdf', 'Screening', 'Referral from Engineering lead. Scheduled initial chat.', now() - interval '3 days', now() - interval '3 days'),
    ('c8888888-8888-8888-8888-888888888888', 'Frank Miller', 'frank.m@example.com', '+1 (555) 876-5432', 'https://linkedin.com/in/frankmiller', 'https://example.com/resumes/frankmiller.pdf', 'Interview', 'Completed hiring manager round. Positive feedback on cloud architecture.', now() - interval '7 days', now() - interval '2 days');

  -- Insert audit logs
  INSERT INTO public.audit_logs (candidate_id, actor_id, actor_role, action, changed_fields, created_at) VALUES
    ('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Recruiter', 'UPDATE', '{"status": {"from": "Applied", "to": "Screening"}}', now() - interval '6 days'),
    ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'Recruiter', 'UPDATE', '{"status": {"from": "Screening", "to": "Interview"}}', now() - interval '4 days'),
    ('c4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'Admin', 'UPDATE', '{"status": {"from": "Interview", "to": "Offer"}}', now() - interval '2 days'),
    ('c5555555-5555-5555-5555-555555555555', 'a1111111-1111-1111-1111-111111111111', 'Admin', 'UPDATE', '{"status": {"from": "Offer", "to": "Hired"}}', now() - interval '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
