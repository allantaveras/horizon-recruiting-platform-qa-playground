import { test, expect } from '@playwright/test';

test.describe('Candidate Search & Filter Operations', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  test('TC-SEARCH-01: should filter candidates by name search', async ({ page }) => {
    // Login as Admin
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to candidates
    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Verify all seeded candidates are visible initially
    await expect(page.locator('#candidates-table')).toContainText('John Doe');
    await expect(page.locator('#candidates-table')).toContainText('Jane Smith');

    // Search for "John"
    await page.fill('#search-input', 'John');

    // Wait for debounce (300ms) + API response
    await page.waitForTimeout(500);

    // Only John Doe and Alice Johnson should match
    await expect(page.locator('#candidates-table')).toContainText('John Doe');
    // Jane Smith should be filtered out
    await expect(page.locator('#candidates-table')).not.toContainText('Jane Smith');
  });

  test('TC-SEARCH-02: should filter candidates by email search', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Search by email fragment
    await page.fill('#search-input', 'jane.smith');
    await page.waitForTimeout(500);

    await expect(page.locator('#candidates-table')).toContainText('Jane Smith');
    await expect(page.locator('#candidates-table')).not.toContainText('John Doe');
  });

  test('TC-SEARCH-03: should show empty state when no candidates match search', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Search for nonsense
    await page.fill('#search-input', 'xyznonexistent12345');
    await page.waitForTimeout(500);

    // Should show empty state message
    await expect(page.locator('text=No candidates match')).toBeVisible();
  });

  test('TC-FILTER-01: should filter candidates by pipeline status', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Filter by "Hired" status
    await page.selectOption('#filter-status-select', 'Hired');
    await page.waitForTimeout(500);

    // Only Charlie Green is Hired
    await expect(page.locator('#candidates-table')).toContainText('Charlie Green');
    await expect(page.locator('#candidates-table')).not.toContainText('John Doe');
    await expect(page.locator('#candidates-table')).not.toContainText('Jane Smith');
  });

  test('TC-FILTER-02: should filter candidates by Rejected status', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Filter by "Rejected" status
    await page.selectOption('#filter-status-select', 'Rejected');
    await page.waitForTimeout(500);

    // Only David White is Rejected
    await expect(page.locator('#candidates-table')).toContainText('David White');
    await expect(page.locator('#candidates-table')).not.toContainText('Charlie Green');
  });

  test('TC-FILTER-03: should reset to all candidates when clearing filter', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Apply a filter
    await page.selectOption('#filter-status-select', 'Hired');
    await page.waitForTimeout(500);
    await expect(page.locator('#candidates-table')).not.toContainText('John Doe');

    // Clear the filter
    await page.selectOption('#filter-status-select', '');
    await page.waitForTimeout(500);

    // All candidates should be visible again
    await expect(page.locator('#candidates-table')).toContainText('John Doe');
    await expect(page.locator('#candidates-table')).toContainText('Charlie Green');
  });
});
