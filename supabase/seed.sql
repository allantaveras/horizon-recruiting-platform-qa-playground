-- Clear existing data (in case of reseeding)
TRUNCATE public.audit_logs CASCADE;
TRUNCATE public.audit_webhooks CASCADE;
TRUNCATE public.candidates CASCADE;
DELETE FROM auth.users WHERE email IN ('admin@recruiting.local', 'recruiter@recruiting.local', 'viewer@recruiting.local');
DELETE FROM public.profiles WHERE id IN ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502');

-- Insert seed users into auth.users (password is 'password123')
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-1111-1111-111111111111',
    '',
    '',
    'admin@recruiting.local',
    '$2a$10$/DEhf8pSNKjf6HnQoI5znODoi18PwwA1DyRFqxd5plvLu13srDhXC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"Admin"}',
    false,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'b2222222-2222-2222-2222-222222222222',
    '',
    '',
    'recruiter@recruiting.local',
    '$2a$10$/DEhf8pSNKjf6HnQoI5znODoi18PwwA1DyRFqxd5plvLu13srDhXC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"Recruiter"}',
    false,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502',
    '',
    '',
    'viewer@recruiting.local',
    '$2a$10$/DEhf8pSNKjf6HnQoI5znODoi18PwwA1DyRFqxd5plvLu13srDhXC',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"Viewer"}',
    false,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

-- Insert seed identities into auth.identities
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    '{"sub": "a1111111-1111-1111-1111-111111111111", "email": "admin@recruiting.local"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    '{"sub": "b2222222-2222-2222-2222-222222222222", "email": "recruiter@recruiting.local"}',
    'email',
    now(),
    now(),
    now()
  ),
  (
    '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502',
    '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502',
    '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502',
    '{"sub": "3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502", "email": "viewer@recruiting.local"}',
    'email',
    now(),
    now(),
    now()
  );

-- Sync profiles manually if trigger timing differs, using ON CONFLICT DO NOTHING
INSERT INTO public.profiles (id, role, updated_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Admin', now()),
  ('b2222222-2222-2222-2222-222222222222', 'Recruiter', now()),
  ('3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502', 'Viewer', now())
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Seed Candidates
INSERT INTO public.candidates (id, name, email, phone, linkedin, resume_url, status, notes, created_at, updated_at) VALUES
  (
    'ed0905c9-1111-4e76-9433-b9715deb4ed2',
    'John Doe',
    'john.doe@example.com',
    '+1 (555) 123-4567',
    'https://linkedin.com/in/johndoe',
    'https://example.com/resumes/johndoe.pdf',
    'Applied',
    'Strong background in React and node.js. Needs screening call.',
    now() - interval '10 days',
    now() - interval '10 days'
  ),
  (
    '7ddd3508-3742-469b-93c5-9d645a8328eb',
    'Jane Smith',
    'jane.smith@example.com',
    '+1 (555) 987-6543',
    'https://linkedin.com/in/janesmith',
    'https://example.com/resumes/janesmith.pdf',
    'Screening',
    'Passed initial phone screen. Communication skills are excellent.',
    now() - interval '8 days',
    now() - interval '6 days'
  ),
  (
    '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502',
    'Alice Johnson',
    'alice.j@example.com',
    '+1 (555) 456-7890',
    'https://linkedin.com/in/alicejohnson',
    'https://example.com/resumes/alicejohnson.pdf',
    'Interview',
    'Technical assessment complete. Onsite interviews scheduled for tomorrow.',
    now() - interval '12 days',
    now() - interval '4 days'
  ),
  (
    '0574dd65-a66a-4813-9c8a-089b9f997b5f',
    'Bob Brown',
    'bob.brown@example.com',
    '+1 (555) 321-7654',
    'https://linkedin.com/in/bobbrown',
    'https://example.com/resumes/bobbrown.pdf',
    'Offer',
    'Offer package sent. Waiting for response. Base salary: $135k.',
    now() - interval '15 days',
    now() - interval '2 days'
  ),
  (
    'd2ecf6e6-c84d-4f94-89f5-4f2af4e68b73',
    'Charlie Green',
    'charlie.g@example.com',
    '+1 (555) 789-0123',
    'https://linkedin.com/in/charliegreen',
    'https://example.com/resumes/charliegreen.pdf',
    'Hired',
    'Offer accepted! Start date set for next month. Background check complete.',
    now() - interval '20 days',
    now() - interval '1 day'
  ),
  (
    'c7fb9358-47a7-44d6-a263-83cee0d45c0d',
    'David White',
    'david.w@example.com',
    '+1 (555) 890-1234',
    'https://linkedin.com/in/davidwhite',
    'https://example.com/resumes/davidwhite.pdf',
    'Rejected',
    'Failed technical test. Rejection email sent.',
    now() - interval '5 days',
    now() - interval '3 days'
  ),
  (
    '753a93cc-ecf4-4c28-b9d4-39966eb0e375',
    'Eva Black',
    'eva.black@example.com',
    '+1 (555) 234-5678',
    'https://linkedin.com/in/evablack',
    'https://example.com/resumes/evablack.pdf',
    'Screening',
    'Referral from Engineering lead. Scheduled initial chat.',
    now() - interval '3 days',
    now() - interval '3 days'
  ),
  (
    '51bd78fd-bc28-47c7-beac-7d1e5ff74b6c',
    'Frank Miller',
    'frank.m@example.com',
    '+1 (555) 876-5432',
    'https://linkedin.com/in/frankmiller',
    'https://example.com/resumes/frankmiller.pdf',
    'Interview',
    'Completed hiring manager round. Positive feedback on cloud architecture.',
    now() - interval '7 days',
    now() - interval '2 days'
  );

-- Seed Audit Logs
INSERT INTO public.audit_logs (candidate_id, actor_id, actor_role, action, changed_fields, created_at) VALUES
  (
    '7ddd3508-3742-469b-93c5-9d645a8328eb',
    'b2222222-2222-2222-2222-222222222222',
    'Recruiter',
    'UPDATE',
    '{"status": {"from": "Applied", "to": "Screening"}}',
    now() - interval '6 days'
  ),
  (
    '3b8e6dfe-a3a0-4e3c-96c8-aacbf9c6f502',
    'b2222222-2222-2222-2222-222222222222',
    'Recruiter',
    'UPDATE',
    '{"status": {"from": "Screening", "to": "Interview"}}',
    now() - interval '4 days'
  ),
  (
    '0574dd65-a66a-4813-9c8a-089b9f997b5f',
    'a1111111-1111-1111-1111-111111111111',
    'Admin',
    'UPDATE',
    '{"status": {"from": "Interview", "to": "Offer"}}',
    now() - interval '2 days'
  ),
  (
    'd2ecf6e6-c84d-4f94-89f5-4f2af4e68b73',
    'a1111111-1111-1111-1111-111111111111',
    'Admin',
    'UPDATE',
    '{"status": {"from": "Offer", "to": "Hired"}}',
    now() - interval '1 day'
  );
