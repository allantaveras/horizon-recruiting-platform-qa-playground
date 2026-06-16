# QA Regression Test Checklist

Execute this checklist prior to merging Pull Requests to main or deploying release packages.

## 1. Authentication & Session Validation
- [ ] Direct page access redirection (verify `/dashboard` and `/candidates` redirect to `/` when session is cleared).
- [ ] Login flow (verify valid email and password log in successfully).
- [ ] Login error messaging (verify bad passwords return error block in UI).
- [ ] Logout functionality (verify cookie `sb-access-token` is deleted and user is routed back to `/`).

## 2. Role-Based Permissions (RBAC)
- [ ] **Admin User**:
  - [ ] Verify full CRUD rights on Candidates (can Add, Edit, Delete).
- [ ] **Recruiter User**:
  - [ ] Verify Add Candidate and Edit Candidate features work.
  - [ ] Verify Delete button is completely hidden in Candidate details.
- [ ] **Viewer User**:
  - [ ] Verify Add Candidate button is hidden on candidates roster.
  - [ ] Verify Edit Candidate and Delete candidate buttons are hidden on details views.
- [ ] **Global Navbar check**:
  - [ ] Verify that no Webhook link or debug UI is visible to any role.

## 3. Candidate Operations & Fields
- [ ] Add Candidate validation checks (empty name field, bad email format, invalid status inputs).
- [ ] Add Candidate submission (verify record displays in roster instantly).
- [ ] Edit Candidate details (verify updates to name, phone, notes, links persist).
- [ ] Database record auditDiff logs (verify details view shows updated timeline change logs).

## 4. Webhook Trigger Pipeline
- [ ] Transition candidate status to `Interview` (verify `audit_webhooks` database log inserts a record).
- [ ] Verify webhook request response status returns `200` in the audit log.
- [ ] Verify that `received_webhooks.json` in workspace logs the webhook payload with valid signature validation.

## 5. Dashboard Metrics Accuracy
- [ ] Verify count cards match total candidates directory items.
- [ ] Verify "Hired" count matches candidates labeled as hired.
- [ ] Verify Conversion Rate acceptance probability displays valid percentages.
