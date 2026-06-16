import { test, expect } from '@playwright/test';

test.describe('Role Based Authentication', () => {
  test.beforeEach(async ({ request }) => {
    // Reset database state before each test run
    const res = await request.post('/api/test/reset');
    if (!res.ok()) {
      console.error('Reset database failed:', res.status(), await res.text());
    }
    expect(res.ok()).toBeTruthy();
  });

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
    
    await page.goto('/candidates');
    await expect(page).toHaveURL('/');
  });

  test('should sign in as Administrator, check navigation and logout', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');
    
    // Verify role visibility
    await expect(page.locator('text=admin@recruiting.local')).toBeVisible();
    await expect(page.locator('text="Admin"')).toBeVisible();
    
    // Verify Webhook Logs navigation link is absent
    await expect(page.locator('#nav-webhooks')).toBeHidden();
    
    // Logout
    await page.click('#logout-btn');
    await expect(page).toHaveURL('/');
  });

  test('should sign in as Guest Viewer and verify read-only access limits', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-viewer');
    await expect(page).toHaveURL('/dashboard');
    
    // Verify Webhook Logs link is hidden
    await expect(page.locator('#nav-webhooks')).toBeHidden();
    
    // Move to candidates roster and verify Add Candidate button is hidden
    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');
    await expect(page.locator('#add-candidate-btn')).toBeHidden();
  });
});
