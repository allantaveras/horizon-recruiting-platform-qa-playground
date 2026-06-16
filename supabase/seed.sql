-- Clear existing data (in case of reseeding)
TRUNCATE public.audit_logs CASCADE;
TRUNCATE public.audit_webhooks CASCADE;
TRUNCATE public.candidates CASCADE;
DELETE FROM auth.users WHERE email IN ('admin@recruiting.local', 'recruiter@recruiting.local', 'viewer@recruiting.local');
DELETE FROM public.profiles WHERE id IN ('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333');

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
    'c3333333-3333-3333-3333-333333333333',
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
    'c3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    '{"sub": "c3333333-3333-3333-3333-333333333333", "email": "viewer@recruiting.local"}',
    'email',
    now(),
    now(),
    now()
  );

-- Sync profiles manually if trigger timing differs, using ON CONFLICT DO NOTHING
INSERT INTO public.profiles (id, role, updated_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Admin', now()),
  ('b2222222-2222-2222-2222-222222222222', 'Recruiter', now()),
  ('c3333333-3333-3333-3333-333333333333', 'Viewer', now())
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Seed Candidates
INSERT INTO public.candidates (id, name, email, phone, linkedin, resume_url, status, notes, created_at, updated_at) VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
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
    'c2222222-2222-2222-2222-222222222222',
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
    'c3333333-3333-3333-3333-333333333333',
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
    'c4444444-4444-4444-4444-444444444444',
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
    'c5555555-5555-5555-5555-555555555555',
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
    'c6666666-6666-6666-6666-666666666666',
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
    'c7777777-7777-7777-7777-777777777777',
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
    'c8888888-8888-8888-8888-888888888888',
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
    'c2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'Recruiter',
    'UPDATE',
    '{"status": {"from": "Applied", "to": "Screening"}}',
    now() - interval '6 days'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222',
    'Recruiter',
    'UPDATE',
    '{"status": {"from": "Screening", "to": "Interview"}}',
    now() - interval '4 days'
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'a1111111-1111-1111-1111-111111111111',
    'Admin',
    'UPDATE',
    '{"status": {"from": "Interview", "to": "Offer"}}',
    now() - interval '2 days'
  ),
  (
    'c5555555-5555-5555-5555-555555555555',
    'a1111111-1111-1111-1111-111111111111',
    'Admin',
    'UPDATE',
    '{"status": {"from": "Offer", "to": "Hired"}}',
    now() - interval '1 day'
  );
