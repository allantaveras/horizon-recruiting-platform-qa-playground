import { test, expect } from '@playwright/test';

test.describe('Hiring Pipeline Stage Transitions', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  test('TC-PIPE-01: Recruiter should advance candidate through pipeline stages via stepper', async ({ page }) => {
    // Login as Recruiter
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to John Doe (Applied status)
    await page.click('#nav-candidates');
    await page.click('#view-details-ed0905c9-1111-4e76-9433-b9715deb4ed2');
    await expect(page.url()).toContain('/candidates/');

    // Verify current status is Applied
    await expect(page.locator('text=Applied').first()).toBeVisible();

    // Click the Screening stage button on the pipeline stepper
    await page.click('#pipeline-stage-screening');

    // Wait for status update
    await page.waitForTimeout(1000);

    // Verify the pipeline stepper now shows Screening as current
    await expect(page.locator('#pipeline-stage-screening')).toContainText('Current');

    // Verify the audit trail logged the status change
    await expect(page.locator('text=Changed status from "Applied" to "Screening"')).toBeVisible();
  });

  test('TC-PIPE-02: Admin should transition candidate to Rejected status', async ({ page }) => {
    // Login as Admin
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to John Doe (Applied status)
    await page.click('#nav-candidates');
    await page.click('#view-details-ed0905c9-1111-4e76-9433-b9715deb4ed2');
    await expect(page.url()).toContain('/candidates/');

    // Click the Rejected stage button
    await page.click('#pipeline-stage-rejected');
    await page.waitForTimeout(1000);

    // Verify the pipeline stepper now shows Rejected as current
    await expect(page.locator('#pipeline-stage-rejected')).toContainText('Current');

    // Verify audit trail logged the rejection
    await expect(page.locator('text=Changed status from "Applied" to "Rejected"')).toBeVisible();
  });

  test('TC-PIPE-03: Viewer should not be able to click pipeline stage buttons', async ({ page }) => {
    // Login as Viewer
    await page.goto('/');
    await page.click('#quick-viewer');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to John Doe detail page
    await page.click('#nav-candidates');
    await page.click('#view-details-ed0905c9-1111-4e76-9433-b9715deb4ed2');
    await expect(page.url()).toContain('/candidates/');

    // Verify pipeline stage buttons are disabled for Viewer
    await expect(page.locator('#pipeline-stage-screening')).toBeDisabled();
    await expect(page.locator('#pipeline-stage-interview')).toBeDisabled();
    await expect(page.locator('#pipeline-stage-offer')).toBeDisabled();
    await expect(page.locator('#pipeline-stage-hired')).toBeDisabled();
    await expect(page.locator('#pipeline-stage-rejected')).toBeDisabled();
  });

  test('TC-PIPE-04: should update status via inline dropdown on candidates list', async ({ page }) => {
    // Login as Recruiter
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Find John Doe's row and change status via the inline dropdown
    const johnDoeRow = page.locator('tr', { hasText: 'John Doe' });
    await johnDoeRow.locator('select').selectOption('Screening');

    // Wait for status update API call
    await page.waitForTimeout(1000);

    // Verify the dropdown now shows Screening
    await expect(johnDoeRow.locator('select')).toHaveValue('Screening');
  });
});
