import { test, expect } from '@playwright/test';

test.describe('Candidate Self-Application Flow', () => {
  test.beforeEach(async ({ request }) => {
    // Reset DB to clean state
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  test('should allow candidate to submit application and allow admin to review it', async ({ page }) => {
    // Log browser console messages
    page.on('console', msg => console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('BROWSER UNCAUGHT EXCEPTION:', err.message));

    // 1. Visit landing page
    await page.goto('/');
    
    // 2. Click candidate application link
    await page.click('#candidate-apply-link');
    await expect(page).toHaveURL('/apply');

    // 3. Fill and submit candidate form
    await page.fill('#apply-name', 'Candidate Public Test');
    await page.fill('#apply-email', 'candidate.public@example.com');
    await page.fill('#apply-phone', '+1 (555) 333-2222');
    await page.fill('#apply-linkedin', 'https://linkedin.com/in/candidatepublic');
    await page.fill('#apply-resume', 'https://example.com/resumes/candidatepublic.pdf');
    await page.fill('#apply-notes', 'This is a cover letter note.');

    await page.click('#apply-submit-btn');

    // 4. Verify success screen
    await expect(page.locator('text=Application Received!')).toBeVisible();

    // 5. Return to login portal
    await page.click('#return-to-portal-btn');
    await expect(page).toHaveURL('/');

    // 6. Sign in as Admin
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');
    await page.waitForTimeout(500);

    // 7. Go to Candidates List and verify candidate is listed
    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');
    await expect(page.locator('#candidates-table')).toContainText('Candidate Public Test');
    await expect(page.locator('#candidates-table')).toContainText('candidate.public@example.com');

    // 8. Go to candidate review cockpit
    await page.locator('tr', { hasText: 'Candidate Public Test' }).locator('text=Review').click();
    await expect(page).toHaveURL(/\/candidates\/.+/);

    // 9. Verify details and audit trail logs
    await expect(page.locator('text=Candidate Public Test')).toBeVisible();
    await expect(page.locator('text=Applied')).toBeVisible();
    await expect(page.locator('text=Candidate Action')).toBeVisible();
    await expect(page.locator('text=Created candidate profile')).toBeVisible();
  });
});
