# Pull Request Description

## Overview
Summarize the scope of changes, new components, or modifications introduced by this PR.

## Checklist
### Developer Checklist
- [ ] Code builds locally (`npm run build`).
- [ ] Lint checks passed (`npm run lint`).
- [ ] Migrations run cleanly on local database environment.
- [ ] Environment variables documented in `.env.example`.

### QA & Review Checklist
- [ ] Reviewer verifies role limits (verify no privilege escalations for Viewer/Recruiter roles).
- [ ] Verify database schema compatibility (migrations do not lock tables or break backward compatibility).
- [ ] Webhook triggers checked (changing status to Interview dispatches webhook payload correctly).
- [ ] Automation test suite executes successfully (`npm run test`).

## E2E Playwright Run Outcome
Paste Playwright CLI run logs showing passing assertions:
```text
// Paste execution CLI text logs
```
