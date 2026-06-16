# Production Verification Checklist (PVT)

Follow this checklist immediately after code is deployed to the Production/Staging environments. Avoid modifying existing candidate records; instead, use designated test entities.

## 1. Post-Deployment Smoke Test
- [ ] **Deployment Sanity**:
  - [ ] Visit the landing portal `/`. Confirm HTTPS certificate is active and no styling files are missing.
- [ ] **Authentication Check**:
  - [ ] Log in with a valid user role. Confirm dashboard page renders.
  - [ ] Log out. Verify redirections are instantaneous.

## 2. API & Integration Checks
- [ ] **Supabase Connectivity**:
  - [ ] Perform a simple search query on Candidates list page. Confirm API returns candidate records.
- [ ] **Webhook Gateway Check**:
  - [ ] Create a designated test candidate: `PVT-TEST-CANDIDATE`.
  - [ ] Update their status to `Interview`.
  - [ ] Verify that the webhook log records success. Confirm with target service receiver (or external receiver logs).

## 3. Database Integrity Sanity
- [ ] **Migration Check**:
  - [ ] Connect to production database shell. Run:
    ```sql
    SELECT count(*) FROM public.candidates;
    ```
    Confirm table schema displays all fields cleanly.

## 4. Rollback Criteria & Actions
- [ ] **Rollback Indicators**:
  - [ ] System returns HTTP `5xx` errors for all candidates queries.
  - [ ] Database mutations fail (cannot create/update profiles).
- [ ] **Emergency Contact**:
  - [ ] DevOps On-Call Engineer: devops-oncall@horizon-recruiting.local / Slack #recruiting-ops-alerts
  - [ ] Supabase Dashboard Status: https://status.supabase.com or internal portal https://status.horizon-recruiting.local
