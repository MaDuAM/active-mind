# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\tests\critical-flow.spec.js >> critical flow: login → create entry → change status → delete
- Location: e2e\tests\critical-flow.spec.js:3:5

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('h1:has-text("Dashboard")') to be visible

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "ActiveMind" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in with your account
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Username
        - textbox "Username" [ref=e11]:
          - /placeholder: z.B. peter.parker
          - text: testuser
      - generic [ref=e12]:
        - generic [ref=e13]: Password
        - textbox "Password" [ref=e14]:
          - /placeholder: ••••••••
          - text: test123
      - button "Sign In" [ref=e15] [cursor=pointer]
      - button "Create new account" [ref=e17] [cursor=pointer]
  - generic [ref=e18]:
    - img [ref=e20]
    - button "Open Tanstack query devtools" [ref=e68] [cursor=pointer]:
      - img [ref=e69]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('critical flow: login → create entry → change status → delete', async ({ page }) => {
  4  |   // 1. Login
  5  |   await page.goto('http://localhost:5173/');
  6  |   await page.screenshot({ path: 'e2e/screenshots/1-goto.png' });
  7  | 
  8  |   // Warten auf Login-Form
  9  |   await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  10 |   await page.fill('input[type="text"]', 'testuser');
  11 |   await page.fill('input[type="password"]', 'test123');
  12 |   await page.click('button[type="submit"]');
  13 | 
  14 |   // Screenshot nach Login
  15 |   await page.screenshot({ path: 'e2e/screenshots/2-login.png' });
  16 | 
  17 |   // Prüfen ob Login erfolgreich
  18 |   const body = await page.textContent('body');
  19 |   console.log('Body after login:', body);
  20 | 
  21 |   // Warten auf Dashboard
  22 |   await expect(page.locator('text=ActiveMind')).toBeVisible({ timeout: 10000 });
  23 | 
  24 |   // 2. Create entry
> 25 |   await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
     |              ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  26 |   const newEntryBtn = page.locator('button:has-text("+ New Entry")');
  27 |   await newEntryBtn.waitFor({ state: 'visible', timeout: 10000 });
  28 |   await newEntryBtn.click();
  29 | 
  30 |   await page.waitForSelector('select');
  31 |   await page.selectOption('select', { label: 'Test Topic' });
  32 |   await page.fill('textarea[placeholder*="Detailed description"]', 'Test Essence');
  33 |   await page.fill('input[placeholder*="Short summary"]', 'Test Short');
  34 |   await page.click('button:has-text("Create Entry")');
  35 |   await expect(page.locator('text=Entry successfully created')).toBeVisible({ timeout: 10000 });
  36 | 
  37 |   // 3. Status change
  38 |   await page.click('text=Test Short');
  39 |   await page.click('button:has-text("Status → Active")');
  40 |   await page.fill('textarea[placeholder*="Why was this change made?"]', 'Status changed');
  41 |   await page.click('button:has-text("Confirm")');
  42 |   await expect(page.locator('text=Status changed to ACTIVE')).toBeVisible({ timeout: 10000 });
  43 | 
  44 |   // 4. Delete
  45 |   await page.click('button:has-text("Delete")');
  46 |   await page.click('button:has-text("Delete")');
  47 |   await expect(page.locator('text=Entry moved to Removed Entries')).toBeVisible({ timeout: 10000 });
  48 | });
```