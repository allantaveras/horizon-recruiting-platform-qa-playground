# Bug Report: [Title summarizing defect, e.g. Viewer role bypasses edit API]

## Defect Summary
Provide a brief description of the unexpected behavior.

## Environment Details
- **Browser**: [e.g. Chrome 125, Safari 17]
- **OS**: [e.g. Windows 11, macOS Sonoma]
- **User Role**: [Admin | Recruiter | Viewer]
- **Environment**: [Local Docker Container | Staging | Production]

## Steps to Reproduce
1. Log in as `[Role]`.
2. Navigate to `[Path/Page]`.
3. Perform action `[Action]`.
4. Observe the result.

## Expected Result
What should have happened according to requirements and acceptance criteria.

## Actual Result
What actually happened (including screenshots, copy of UI error banners, etc.).

## Diagnostics & Logs
### API Response Payload
```json
// Paste bad API response body logs here
```

### Browser Console Logs
```text
// Paste browser console outputs here
```

### Database State
```sql
-- Query showing inconsistent data
SELECT * FROM public.candidates WHERE id = '...';
```
