import { test, expect } from '@playwright/test';

test.describe('Form Validation & Error Handling', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  // ─── Public Application Form Validation ───────────────────────────

  test('TC-VAL-01: should show validation error when submitting apply form with empty name', async ({ page }) => {
    await page.goto('/apply');

    // The name field has HTML5 `required`, so we fill it and clear it to bypass browser validation
    await page.fill('#apply-name', ' ');
    await page.fill('#apply-email', 'test@example.com');

    // Remove HTML5 required attribute so our custom JS validation can trigger
    await page.$eval('#apply-name', (el: any) => el.removeAttribute('required'));
    await page.click('#apply-submit-btn');

    // Our JS validation checks if name is empty/whitespace and shows this message
    await expect(page.locator('text=Full Name is required')).toBeVisible();

    // Should NOT navigate to success screen
    await expect(page.locator('text=Application Received!')).toBeHidden();
  });

  test('TC-VAL-02: should show validation error for invalid email on apply form', async ({ page }) => {
    await page.goto('/apply');

    await page.fill('#apply-name', 'Test User');
    await page.fill('#apply-email', 'not-an-email');

    // Remove HTML5 type=email validation so our custom JS validation can trigger
    await page.$eval('#apply-email', (el: any) => el.setAttribute('type', 'text'));
    await page.click('#apply-submit-btn');

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    await expect(page.locator('text=Application Received!')).toBeHidden();
  });

  // ─── Add Candidate Modal Validation ───────────────────────────────

  test('TC-VAL-03: should show validation error for empty name in add candidate modal', async ({ page }) => {
    // Login as Recruiter
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // Open add candidate modal
    await page.click('#add-candidate-btn');

    // Fill email but leave name empty
    await page.fill('#form-email', 'test@example.com');
    await page.click('#submit-candidate-btn');

    // Should show validation error
    await expect(page.locator('text=Candidate Name is required')).toBeVisible();
  });

  test('TC-VAL-04: should show validation error for invalid email in add candidate modal', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await page.click('#add-candidate-btn');

    await page.fill('#form-name', 'Valid Name');
    await page.fill('#form-email', 'invalid-email-format');
    await page.click('#submit-candidate-btn');

    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  // ─── Edit Candidate Form Validation ───────────────────────────────

  test('TC-VAL-05: should show validation error for empty name in edit form', async ({ page }) => {
    // Login as Recruiter
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    // Navigate to a candidate detail
    await page.click('#nav-candidates');
    await page.click('#view-details-ed0905c9-1111-4e76-9433-b9715deb4ed2');
    await expect(page.url()).toContain('/candidates/');

    // Enter edit mode
    await page.click('#edit-candidate-btn');

    // Clear the name field
    await page.fill('#edit-name', '');
    await page.click('#save-candidate-btn');

    // Should show error — the text is "Candidate name cannot be empty"
    await expect(page.locator('text=name cannot be empty')).toBeVisible();
  });

  test('TC-VAL-06: should show validation error for invalid email in edit form', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await page.click('#view-details-ed0905c9-1111-4e76-9433-b9715deb4ed2');
    await expect(page.url()).toContain('/candidates/');

    await page.click('#edit-candidate-btn');

    await page.fill('#edit-email', 'not-a-real-email');
    // Bypass HTML5 type=email validation
    await page.$eval('#edit-email', (el: any) => el.setAttribute('type', 'text'));
    await page.click('#save-candidate-btn');

    // The edit form says "A valid email address is required"
    await expect(page.locator('text=valid email address is required')).toBeVisible();
  });

  test('TC-VAL-07: should cancel edit mode without saving changes', async ({ page }) => {
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    await page.click('#nav-candidates');
    await page.click('#view-details-ed0905c9-1111-4e76-9433-b9715deb4ed2');
    await expect(page.url()).toContain('/candidates/');

    // Enter edit mode
    await page.click('#edit-candidate-btn');

    // Change the name
    await page.fill('#edit-name', 'Changed Name Should Not Save');

    // Click cancel
    await page.click('#cancel-edit-btn');

    // Verify original name is still displayed (not the changed one)
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Changed Name Should Not Save')).toBeHidden();
  });
});
