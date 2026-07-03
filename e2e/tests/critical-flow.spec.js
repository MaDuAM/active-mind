import { test, expect } from '@playwright/test';

test('critical flow: login → create entry → change status → delete', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:5173/');
  await page.screenshot({ path: 'e2e/screenshots/1-goto.png' });

  // Warten auf Login-Form
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  await page.fill('input[type="text"]', 'testuser');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');

  // Screenshot nach Login
  await page.screenshot({ path: 'e2e/screenshots/2-login.png' });

  // Prüfen ob Login erfolgreich
  const body = await page.textContent('body');
  console.log('Body after login:', body);

  // Warten auf Dashboard
  await expect(page.locator('text=ActiveMind')).toBeVisible({ timeout: 10000 });

  // 2. Create entry
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
  const newEntryBtn = page.locator('button:has-text("+ New Entry")');
  await newEntryBtn.waitFor({ state: 'visible', timeout: 10000 });
  await newEntryBtn.click();

  await page.waitForSelector('select');
  await page.selectOption('select', { label: 'Test Topic' });
  await page.fill('textarea[placeholder*="Detailed description"]', 'Test Essence');
  await page.fill('input[placeholder*="Short summary"]', 'Test Short');
  await page.click('button:has-text("Create Entry")');
  await expect(page.locator('text=Entry successfully created')).toBeVisible({ timeout: 10000 });

  // 3. Status change
  await page.click('text=Test Short');
  await page.click('button:has-text("Status → Active")');
  await page.fill('textarea[placeholder*="Why was this change made?"]', 'Status changed');
  await page.click('button:has-text("Confirm")');
  await expect(page.locator('text=Status changed to ACTIVE')).toBeVisible({ timeout: 10000 });

  // 4. Delete
  await page.click('button:has-text("Delete")');
  await page.click('button:has-text("Delete")');
  await expect(page.locator('text=Entry moved to Removed Entries')).toBeVisible({ timeout: 10000 });
});