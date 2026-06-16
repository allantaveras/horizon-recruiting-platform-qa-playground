import { test, expect } from '@playwright/test';

test.describe('Candidate Management Operations', () => {
  test.beforeEach(async ({ request }) => {
    const res = await request.post('/api/test/reset');
    expect(res.ok()).toBeTruthy();
  });

  test('should create, edit, verify audit trail, and validate deletion limits', async ({ page }) => {
    // 1. Sign in as Recruiter
    await page.goto('/');
    await page.click('#quick-recruiter');
    await expect(page).toHaveURL('/dashboard');

    // 2. Go to Candidates List
    await page.click('#nav-candidates');
    await expect(page).toHaveURL('/candidates');

    // 3. Open Add Candidate modal and submit
    await page.click('#add-candidate-btn');
    await page.fill('#form-name', 'QA Engineer Test');
    await page.fill('#form-email', 'qa.test@example.com');
    await page.fill('#form-phone', '+1 (555) 999-0000');
    await page.fill('#form-linkedin', 'https://linkedin.com/in/qatest');
    await page.fill('#form-resume', 'https://example.com/resumes/qatest.pdf');
    await page.selectOption('#form-status', 'Applied');
    await page.fill('#form-notes', 'Pre-screening note.');
    
    await page.click('#submit-candidate-btn');
    
    // Verify candidate was successfully added to table
    await expect(page.locator('#candidates-table')).toContainText('QA Engineer Test');
    await expect(page.locator('#candidates-table')).toContainText('qa.test@example.com');

    // 4. Click Review to access details cockpit
    // We can locate the button by find text or custom ID.
    // In our table, the button link has a descriptive id matching candidate UUID or relative position.
    // Since it is the newest, it is at the top of the table. We can click it directly.
    await page.click('text=Review >> nth=0');
    await expect(page.url()).toContain('/candidates/');

    // 5. Toggle Edit Mode and update status to Screening
    await page.click('#edit-candidate-btn');
    await page.selectOption('#edit-status', 'Screening');
    await page.fill('#edit-notes', 'Updated pre-screening note.');
    await page.click('#save-candidate-btn');

    // Verify UI has updated
    await expect(page.locator('text=Screening >> nth=0')).toBeVisible();
    await expect(page.locator('text=Updated pre-screening note.').first()).toBeVisible();

    // Verify Audit Trail has logged the update action
    await expect(page.locator('text=Recruiter Action').first()).toBeVisible();
    await expect(page.locator('text=Changed status from "Applied" to "Screening"')).toBeVisible();

    // 6. Verify Delete button is hidden for Recruiter
    await expect(page.locator('#delete-candidate-btn')).toBeHidden();
  });

  test('should allow Administrator to delete candidate', async ({ page }) => {
    // 1. Sign in as Admin
    await page.goto('/');
    await page.click('#quick-admin');
    await expect(page).toHaveURL('/dashboard');

    // 2. Go to Candidates List
    await page.click('#nav-candidates');
    
    // Review the top candidate (e.g. John Doe - c1111111-1111-1111-1111-111111111111)
    await page.click('#view-details-c1111111-1111-1111-1111-111111111111');
    await expect(page.url()).toContain('/candidates/');

    // 3. Verify Delete button exists and delete
    await expect(page.locator('#delete-candidate-btn')).toBeVisible();

    await page.click('#delete-candidate-btn');
    await page.click('text=Yes, Delete Permanently');
    await expect(page).toHaveURL('/candidates');

    // Verify candidate is deleted
    await expect(page.locator('#candidates-table')).not.toContainText('John Doe');
  });
});
