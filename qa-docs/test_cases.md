# QA Test Suite & Feature Verification Plan

This document serves as the core training manual for QA Engineers verifying the Internal Recruiting Platform. For each major feature, it details the product requirements, engineering risk factors, manual validation steps, database verification queries, and Playwright automated tests.

---

## 1. Authentication & Role-Based Access Control (RBAC)

### User Story
As an internal platform user, I want to authenticate securely and have access limited strictly to the views and actions defined by my role (Admin, Recruiter, Guest Viewer).

### Acceptance Criteria
1. Unauthenticated users visiting `/dashboard` or `/candidates` are redirected to `/`.
2. Admin credentials (`admin@recruiting.local` / `password123`) grant access to the Dashboard and Candidates roster views. Admins can create, edit, and delete candidates.
3. Recruiter credentials (`recruiter@recruiting.local` / `password123`) grant access to Dashboard and Candidates. Recruiters can create and edit candidates but cannot delete candidate records.
4. Viewer credentials (`viewer@recruiting.local` / `password123`) grant access to Dashboard and Candidates in read-only mode. Viewers cannot add, edit, or delete candidates.

### Risk Analysis
- **High Risk**: Privilege escalation. If a Viewer can make a PUT/DELETE request to `/api/candidates/[id]` and bypass the client-side disabled UI.
- **Mitigation**: Perform role check verification in Middleware for routing redirects, and inside the server-side API Route handlers for actual DB mutations.

### Edge Cases
- Session expiration: verifying user behavior if session cookies expire mid-action.
- Modified cookies: tampering with `sb-access-token` JWT to change claims (assert that cryptographically unsigned JWTs fail server signature validation).

### Manual Test Cases
- **TC-AUTH-01: Anonymous Access Redirection**: Visit `/dashboard` directly without logging in. Verify redirection to `/`.
- **TC-AUTH-02: Viewer Access Limit**: Log in as `Viewer`. Navigate to `/candidates`. Assert that the `Add Candidate` button is hidden.
- **TC-AUTH-03: Recruiter Access Limit**: Log in as `Recruiter`. Navigate to `/candidates/c1111111-1111-1111-1111-111111111111`. Assert that `Delete Record` button is hidden.

### API Test Cases
- **TC-AUTH-API-01: Unauthorized Post Request**: Send a POST request to `/api/candidates` without cookie. Assert status is `401 Unauthorized`.
- **TC-AUTH-API-02: Forbidden Delete Request**: Send a DELETE request to `/api/candidates/c1111111-1111-1111-1111-111111111111` using a Viewer or Recruiter session cookie. Assert status is `403 Forbidden`.

### SQL Validation Queries
Verify role assignments inside public schemas:
```sql
SELECT email, role 
FROM auth.users u
JOIN public.profiles p ON u.id = p.id;
-- Verify that 'admin@recruiting.local' role matches 'Admin'.
```

### Playwright Automated Test
Implemented in [auth.spec.ts](file:///C:/Users/ricar/Desktop/Internal%20Recruitment%20Tool/tests/auth.spec.ts).

---

## 2. Candidate Management (CRUD) & Validation Layer

### User Story
As an Admin or Recruiter, I want to create, read, update, and delete candidate profile details so that we maintain accurate candidate rosters.

### Acceptance Criteria
1. Required fields for creation: `Name` (non-empty) and `Email` (must match standard regex format).
2. Creating a candidate triggers an audit log of action `CREATE`.
3. Updating fields computes a diff and records a timeline log of action `UPDATE`.
4. Deletion cascades and cleans up related logs (restricted to Admin role).

### Risk Analysis
- **Medium Risk**: SQL injection through search inputs. Invalid inputs bypassing validation causing runtime server crashes.
- **Mitigation**: Parameterized SQL bindings via Supabase Client, regex validation inside the API request parsing.

### Edge Cases
- Creating candidate with duplicate email (should be allowed; database does not constraint email uniqueness to allow candidates reapplying for different roles over time, but verify UI handles it cleanly).
- Long string overflows in candidate Name or Notes fields.

### Manual Test Cases
- **TC-CAND-01: Name Field Validation**: Open Add Candidate drawer. Leave Name blank. Press Submit. Verify error "Name is required" is displayed.
- **TC-CAND-02: Email Validation**: Type `john.doe` in Email. Press Submit. Verify error "Please enter a valid email address".
- **TC-CAND-03: Detail View & Timeline**: Add a candidate. Open their details profile. Verify that the created fields match inputs, and the "Hiring Timeline" contains the initial creation log.

### API Test Cases
- **TC-CAND-API-01: Field Validation Schema**: Send POST `/api/candidates` with body `{"name": "", "email": "test@test.com"}`. Assert status code is `400 Bad Request` and returns error json payload.

### SQL Validation Queries
Verify candidate insertion from the SQL shell:
```sql
SELECT id, name, email, status, created_at 
FROM public.candidates 
ORDER BY created_at DESC 
LIMIT 1;
```

### Playwright Automated Test
Implemented in [candidates.spec.ts](file:///C:/Users/ricar/Desktop/Internal%20Recruitment%20Tool/tests/candidates.spec.ts).

---

## 3. Hiring Pipeline & Status Transitions

### User Story
As an recruiter, I want to advance candidates through our pipeline stages (Applied -> Screening -> Interview -> Offer -> Hired / Rejected) to manage active evaluations.

### Acceptance Criteria
1. Allowed statuses are strictly: `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected`.
2. Advancing a status registers an audit log of changed status, displaying "Changed status from X to Y" in the timeline.

### Risk Analysis
- **Low Risk**: Status input tampering. If an API call attempts to set status to `In-Progress` or other arbitrary string values.
- **Mitigation**: Database-level check constraints and API route enums validation.

### Edge Cases
- Directly updating status from `Applied` to `Hired` (allowed by workflow, should audit log cleanly).
- Moving candidate out of `Rejected` stage back into screening (should log the status shift on the timeline).

### Manual Test Cases
- **TC-PIPE-01: Status Checklist Updates**: Log in as Recruiter. Open a candidate detail profile. Click Edit. Change status to `Offer`. Save. Check that the header status badge updates and the timeline lists the change.

### API Test Cases
- **TC-PIPE-API-01: Invalid Status Payload**: Send PUT `/api/candidates/c1111111-1111-1111-1111-111111111111` with `{"status": "Awesome"}`. Assert status code is `400 Bad Request`.

### SQL Validation Queries
Verify status integrity rules:
```sql
SELECT id, name, status 
FROM public.candidates 
WHERE status NOT IN ('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected');
-- Verify that this query returns 0 rows (integrity check).
```

### Playwright Automated Test
Implemented in [candidates.spec.ts](file:///C:/Users/ricar/Desktop/Internal%20Recruitment%20Tool/tests/candidates.spec.ts).

---

## 4. Dashboard Metrics & Analytics

### User Story
As an operations lead, I want a high-level analytics dashboard displaying candidate pipelines, hired counts, and acceptance ratios to track recruiting throughput.

### Acceptance Criteria
1. Total Candidates count matches total records in DB.
2. Metrics cards correctly calculate Hired, In Pipeline, and Offer-to-Hire accepts.
3. Interactive Pipeline charts correctly map database status balances.

### Risk Analysis
- **Medium Risk**: Div-by-zero math crash if there are 0 candidates or 0 offers in the database.
- **Mitigation**: Wrap division logic with guard statements `offer + hired > 0 ? ... : 0` to return fallback values.

### Edge Cases
- Blank database state: database contains 0 candidate records. (Dashboard should display 0s without crashing or formatting error values like `NaN%`).

### Manual Test Cases
- **TC-DASH-01: Empty Database Sanity**: Clean database. Visit `/dashboard`. Verify that Total Database, Hires, and Conversion cards print `0` and `0%` without server exceptions.

### SQL Validation Queries
Validate count consistency between backend API aggregate math and raw SQL results:
```sql
SELECT 
  (SELECT COUNT(*) FROM public.candidates) as total,
  (SELECT COUNT(*) FROM public.candidates WHERE status = 'Hired') as hired,
  (SELECT COUNT(*) FROM public.candidates WHERE status IN ('Applied', 'Screening', 'Interview', 'Offer')) as pipeline;
```

---

## 5. Timeline Audit History Logs

### User Story
As an administrator, I want an immutable history of candidate record changes so we have full accountability and trace logging for candidate profiles.

### Acceptance Criteria
1. Every CREATE, UPDATE, or DELETE logs the actor's user ID, role, timestamp, action type, and field diffs.
2. The UI details page displays this log chronologically.

### Risk Analysis
- **Medium Risk**: Log leakage or failure. If audit writes fail, the main transaction should roll back so DB writes are atomic.
- **Mitigation**: Wrap changes and audit insertions within transactional APIs or DB levels.

### Edge Cases
- Logging multiple fields simultaneously: changing Name and Phone at once must record a single audit log row containing diffs for both fields.

### SQL Validation Queries
Verify the diff structure of an audit log update:
```sql
SELECT action, changed_fields 
FROM public.audit_logs 
WHERE action = 'UPDATE' 
ORDER BY created_at DESC 
LIMIT 1;
-- Verify json payload structure: {"status": {"from": "Applied", "to": "Screening"}}
```

---

## 6. HMAC-Signed Interview Webhooks

### User Story
As an integration engineer, I want the system to fire a secure webhook when a candidate enters the `Interview` stage so that downstream scheduling systems trigger instantly.

### Acceptance Criteria
1. Setting candidate status to `Interview` fires a POST request to `/api/webhooks`.
2. The POST request contains header `X-Recruiting-Signature` representing the HMAC-SHA256 signature of the payload using `WEBHOOK_SECRET`.
3. The mock webhook receiver validates the signature and saves verified requests to `received_webhooks.json`.
4. Delivery outcomes are recorded inside the database table `audit_webhooks`.

### Risk Analysis
- **High Risk**: Signature bypass. If the receiver accepts arbitrary payloads, attackers can trigger false interview alerts.
- **Mitigation**: Reject any payload if computed HMAC fails signature check.

### Edge Cases
- Webhook receiver is offline: verify that API logs `500` response status inside the database, records `success = false` in `audit_webhooks`, and increments retry indicators.

### Manual Test Cases
- **TC-WEB-01: Webhook Flow & Logs**: Move candidate to `Interview`. Query the webhook log endpoint `/api/webhooks` (or inspect the `received_webhooks.json` file in workspace) to verify the webhook payload contains correct candidate details.

### API Test Cases
- **TC-WEB-API-01: Bad Webhook Signature**: Send a POST request directly to `/api/webhooks` with an invalid `X-Recruiting-Signature`. Assert status is `401 Unauthorized`.

### SQL Validation Queries
Verify logged delivery events:
```sql
SELECT event_type, target_url, response_status, success 
FROM public.audit_webhooks 
ORDER BY created_at DESC;
```

### Playwright Automated Test
Implemented in [api.spec.ts](file:///C:/Users/ricar/Desktop/Internal%20Recruitment%20Tool/tests/api.spec.ts).
