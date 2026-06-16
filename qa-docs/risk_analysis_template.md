# Release Risk Analysis Template

Use this document to analyze features, calculate risk parameters, and organize QA test execution.

## 1. Feature Profile
- **Feature Name**: [e.g. Candidates Webhook Dispatch]
- **Developer Lead**: [Name]
- **Target Release Date**: [Date]

## 2. Risk Evaluation Grid
Rate risk parameters on a scale of 1 (Low) to 5 (High).

| Risk Dimension | Score (1-5) | Rationale / Mitigation |
| :--- | :---: | :--- |
| **Business Impact**: How critical is this feature to the business? (e.g. system breaks, webhooks fail) | | |
| **Technical Complexity**: Are we modifying database schemas, auth sessions, or middleware? | | |
| **Blast Radius**: Can modifications affect other unrelated modules or views? | | |
| **Risk Score**: *(Average of above scores)* | **0.0** | |

## 3. High-Risk Scenarios
Detail what could go wrong and how QA will test for it.
1. **Scenario 1**: [e.g. Webhook API returns timeout, blocking candidate details PUT request]
   - **Testing Plan**: Mock network latency or offline webhook target to verify background dispatch retries.
2. **Scenario 2**: [e.g. SQL migration locks candidates table on staging]
   - **Testing Plan**: Execute dry-run migrations on duplicate Docker container volumes first.

## 4. Required Testing Strategy
Check all that apply.
- [ ] Manual Exploratory Testing
- [ ] SQL Database Schema Assertions
- [ ] API Request/Response Integration Verification
- [ ] Playwright E2E UI Automation Tests
- [ ] Performance Load Tests
- [ ] Security Penetration Checks (Role Bypass testing)
