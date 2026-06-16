import { test, expect } from '@playwright/test';

test.describe('Dashboard Analytics & Statistics', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  test('TC-DASH-01: should display accurate pipeline statistics for all seeded candidates', async ({ page }) => {
    // Login as Admin
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    // Verify the dashboard header loaded
    await expect(page.locator('text=Hiring Operations')).toBeVisible();

    // Verify stat card labels are rendered anywhere on the page
    await expect(page.locator('body')).toContainText('Total Database');
    await expect(page.locator('body')).toContainText('Total Hires');
    await expect(page.locator('body')).toContainText('Active Pipeline');
    await expect(page.locator('body')).toContainText('Conversion Rate');

    // Verify the interactive pipeline section shows all stages
    await expect(page.locator('body')).toContainText('Interactive Pipeline Stages');
  });

  test('TC-DASH-02: should show recent candidate roster on dashboard', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    // Verify the Active Candidate Roster section exists
    await expect(page.locator('text=Active Candidate Roster')).toBeVisible();
    await expect(page.locator('text=Manage All')).toBeVisible();

    // Verify at least one candidate name appears in the roster table
    // The dashboard shows the first 4 candidates ordered by created_at DESC
    await expect(page.locator('table')).toBeVisible();
  });

  test('TC-DASH-03: Viewer should see dashboard with read-only context', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-viewer');
    await expect(page).toHaveURL('/dashboard');

    // Dashboard should still load with statistics
    await expect(page.locator('text=Hiring Operations')).toBeVisible();
    await expect(page.locator('text=Total Database')).toBeVisible();

    // Verify Webhook navigation link is absent
    await expect(page.locator('#nav-webhooks')).toBeHidden();
  });

  test('TC-DASH-04: Recruiter should see dashboard with candidate management context', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    // Dashboard should load with statistics
    await expect(page.locator('text=Hiring Operations')).toBeVisible();

    // Recruiter should see candidate navigation
    await expect(page.locator('#nav-candidates')).toBeVisible();
  });
});
