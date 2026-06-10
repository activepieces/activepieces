---
name: playwright-e2e-testing
description: "Playwright modern end-to-end testing framework with cross-browser automation, auto-wait, and built-in test runner"
progressive_disclosure:
  entry_point:
    summary: "Playwright modern end-to-end testing framework with cross-browser automation, auto-wait, and built-in test runner"
    when_to_use: "When writing tests, implementing playwright-e2e-testing, or ensuring code quality."
    quick_start: "1. Review the core concepts below. 2. Apply patterns to your use case. 3. Follow best practices for implementation."
---
# Playwright E2E Testing Skill

---
progressive_disclosure:
  entry_point:
    summary: "Modern E2E testing framework with cross-browser automation and built-in test runner"
    when_to_use:
      - "When testing web applications end-to-end"
      - "When needing cross-browser testing"
      - "When testing user flows and interactions"
      - "When needing screenshot/video recording"
    quick_start:
      - "npm init playwright@latest"
      - "Choose TypeScript and test location"
      - "npx playwright test"
      - "npx playwright show-report"
  token_estimate:
    entry: 75-90
    full: 4200-5200
---

<!-- ENTRY POINT - Load this section by default (75-90 tokens) -->

## Overview

Playwright is a modern end-to-end testing framework that provides cross-browser automation with a built-in test runner, auto-wait mechanisms, and excellent developer experience.

### Key Features
- **Auto-wait**: Automatically waits for elements to be ready
- **Cross-browser**: Chromium, Firefox, WebKit support
- **Built-in runner**: Parallel execution, retries, reporters
- **Network control**: Mock and intercept network requests
- **Debugging**: UI mode, trace viewer, inspector

---

<!-- FULL CONTENT - Load on demand (4200-5200 tokens) -->

## Installation

```bash
# Initialize new Playwright project
npm init playwright@latest

# Or add to existing project
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Fundamentals

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://example.com');

  // Wait for element and check visibility
  const title = page.locator('h1');
  await expect(title).toBeVisible();
  await expect(title).toHaveText('Example Domain');

  // Get page title
  await expect(page).toHaveTitle(/Example/);
});

test.describe('User authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.welcome-message')).toContainText('Welcome');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="username"]', 'invalid');
    await page.fill('[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toHaveText('Invalid credentials');
  });
});
```

### Test Hooks

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard tests', () => {
  test.beforeEach(async ({ page }) => {
    // Run before each test
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await page.close();
  });

  test.beforeAll(async ({ browser }) => {
    // Run once before all tests in describe block
    console.log('Starting test suite');
  });

  test.afterAll(async ({ browser }) => {
    // Run once after all tests
    console.log('Test suite complete');
  });

  test('displays user data', async ({ page }) => {
    await expect(page.locator('.user-name')).toBeVisible();
  });
});
```

## Locator Strategies

### Best Practice: Role-based Locators

```typescript
import { test, expect } from '@playwright/test';

test('accessible locators', async ({ page }) => {
  await page.goto('/form');

  // By role (BEST - accessible and stable)
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
  await page.getByRole('checkbox', { name: 'Subscribe' }).check();
  await page.getByRole('link', { name: 'Learn more' }).click();

  // By label (good for forms)
  await page.getByLabel('Password').fill('secret123');

  // By placeholder
  await page.getByPlaceholder('Search...').fill('query');

  // By text
  await page.getByText('Welcome back').click();
  await page.getByText(/hello/i).isVisible();

  // By test ID (good for dynamic content)
  await page.getByTestId('user-profile').click();

  // By title
  await page.getByTitle('Close dialog').click();

  // By alt text (images)
  await page.getByAltText('User avatar').click();
});
```

### CSS and XPath Locators

```typescript
test('CSS and XPath locators', async ({ page }) => {
  // CSS selectors
  await page.locator('button.primary').click();
  await page.locator('#user-menu').click();
  await page.locator('[data-testid="submit-btn"]').click();
  await page.locator('div.card:first-child').click();

  // XPath (use sparingly)
  await page.locator('xpath=//button[contains(text(), "Submit")]').click();

  // Chaining locators
  const form = page.locator('form#login-form');
  await form.locator('input[name="email"]').fill('user@example.com');
  await form.locator('button[type="submit"]').click();

  // Filter locators
  await page.getByRole('listitem')
    .filter({ hasText: 'Product 1' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
});
```

## Page Object Model

### Page Class Pattern

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log in' });
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await expect(this.errorMessage).toHaveText(message);
  }
}

// pages/DashboardPage.ts
export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('.welcome-message');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  async waitForLoad() {
    await this.welcomeMessage.waitFor({ state: 'visible' });
  }

  async logout() {
    await this.logoutButton.click();
  }
}

// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test('successful login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboard = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login('testuser', 'password123');

  await dashboard.waitForLoad();
  await expect(dashboard.welcomeMessage).toContainText('Welcome');
});
```

### Component Pattern

```typescript
// components/NavigationComponent.ts
import { Page, Locator } from '@playwright/test';

export class NavigationComponent {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly profileLink: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    const nav = page.locator('nav');
    this.homeLink = nav.getByRole('link', { name: 'Home' });
    this.profileLink = nav.getByRole('link', { name: 'Profile' });
    this.searchInput = nav.getByPlaceholder('Search...');
  }

  async navigateToProfile() {
    await this.profileLink.click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }
}
```

## User Interactions

### Form Interactions

```typescript
test('form interactions', async ({ page }) => {
  await page.goto('/form');

  // Text inputs
  await page.fill('input[name="email"]', 'user@example.com');
  await page.type('textarea[name="message"]', 'Hello', { delay: 100 });

  // Checkboxes
  await page.check('input[type="checkbox"][name="subscribe"]');
  await page.uncheck('input[type="checkbox"][name="spam"]');

  // Radio buttons
  await page.check('input[type="radio"][value="option1"]');

  // Select dropdowns
  await page.selectOption('select[name="country"]', 'US');
  await page.selectOption('select[name="color"]', { label: 'Blue' });
  await page.selectOption('select[name="size"]', { value: 'large' });

  // Multi-select
  await page.selectOption('select[multiple]', ['value1', 'value2']);

  // File uploads
  await page.setInputFiles('input[type="file"]', 'path/to/file.pdf');
  await page.setInputFiles('input[type="file"]', [
    'file1.jpg',
    'file2.jpg'
  ]);

  // Clear file input
  await page.setInputFiles('input[type="file"]', []);
});
```

### Mouse and Keyboard

```typescript
test('mouse and keyboard interactions', async ({ page }) => {
  // Click variations
  await page.click('button');
  await page.dblclick('button'); // Double click
  await page.click('button', { button: 'right' }); // Right click
  await page.click('button', { modifiers: ['Shift'] }); // Shift+click

  // Hover
  await page.hover('.tooltip-trigger');
  await expect(page.locator('.tooltip')).toBeVisible();

  // Drag and drop
  await page.dragAndDrop('#draggable', '#droppable');

  // Keyboard
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Hello World');
  await page.keyboard.down('Shift');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.up('Shift');

  // Focus
  await page.focus('input[name="email"]');
  await page.fill('input[name="email"]', 'test@example.com');
});
```

### Waiting Strategies

```typescript
test('waiting strategies', async ({ page }) => {
  // Wait for element
  await page.waitForSelector('.dynamic-content');
  await page.waitForSelector('.modal', { state: 'visible' });
  await page.waitForSelector('.loading', { state: 'hidden' });

  // Wait for load state
  await page.waitForLoadState('load');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  // Wait for URL
  await page.waitForURL('**/dashboard');
  await page.waitForURL(/\/product\/\d+/);

  // Wait for function
  await page.waitForFunction(() => {
    return document.querySelectorAll('.item').length > 5;
  });

  // Wait for timeout (avoid if possible)
  await page.waitForTimeout(1000);

  // Wait for event
  await page.waitForEvent('load');
  await page.waitForEvent('popup');
});
```

## Assertions

### Common Assertions

```typescript
import { test, expect } from '@playwright/test';

test('assertions', async ({ page }) => {
  await page.goto('/dashboard');

  // Visibility
  await expect(page.locator('.header')).toBeVisible();
  await expect(page.locator('.loading')).toBeHidden();
  await expect(page.locator('.optional')).not.toBeVisible();

  // Text content
  await expect(page.locator('h1')).toHaveText('Dashboard');
  await expect(page.locator('h1')).toContainText('Dash');
  await expect(page.locator('.message')).toHaveText(/welcome/i);

  // Attributes
  await expect(page.locator('button')).toBeEnabled();
  await expect(page.locator('button')).toBeDisabled();
  await expect(page.locator('input')).toHaveAttribute('type', 'email');
  await expect(page.locator('input')).toHaveValue('test@example.com');

  // CSS
  await expect(page.locator('.button')).toHaveClass('btn-primary');
  await expect(page.locator('.button')).toHaveClass(/btn-/);
  await expect(page.locator('.element')).toHaveCSS('color', 'rgb(255, 0, 0)');

  // Count
  await expect(page.locator('.item')).toHaveCount(5);

  // URL and title
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/dashboard$/);
  await expect(page).toHaveTitle('Dashboard - My App');
  await expect(page).toHaveTitle(/Dashboard/);

  // Screenshot comparison
  await expect(page).toHaveScreenshot('dashboard.png');
  await expect(page.locator('.widget')).toHaveScreenshot('widget.png');
});
```

### Custom Assertions

```typescript
test('custom matchers', async ({ page }) => {
  // Soft assertions (continue test on failure)
  await expect.soft(page.locator('.title')).toHaveText('Welcome');
  await expect.soft(page.locator('.subtitle')).toBeVisible();

  // Multiple elements
  const items = page.locator('.item');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('First');
  await expect(items.nth(1)).toContainText('Second');

  // Poll assertions
  await expect(async () => {
    const response = await page.request.get('/api/status');
    expect(response.ok()).toBeTruthy();
  }).toPass({
    timeout: 10000,
    intervals: [1000, 2000, 5000],
  });
});
```

## Authentication Patterns

### Storage State Pattern

```typescript
// auth.setup.ts - Run once to save auth state
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
    },
  ],
});

// tests/dashboard.spec.ts - Already authenticated
test('view dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  // Already logged in!
  await expect(page.locator('.user-menu')).toBeVisible();
});
```

### Multiple User Roles

```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

type Fixtures = {
  adminPage: Page;
  userPage: Page;
};

export const test = base.extend<Fixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// tests/permissions.spec.ts
import { test } from '../fixtures/auth';

test('admin can access admin panel', async ({ adminPage }) => {
  await adminPage.goto('/admin');
  await expect(adminPage.locator('.admin-panel')).toBeVisible();
});

test('regular user cannot access admin panel', async ({ userPage }) => {
  await userPage.goto('/admin');
  await expect(userPage.locator('.access-denied')).toBeVisible();
});
```

## Network Control

### Request Mocking

```typescript
test('mock API responses', async ({ page }) => {
  // Mock API response
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' },
        ],
      }),
    });
  });

  await page.goto('/users');
  await expect(page.locator('.user-list')).toContainText('John Doe');
});

test('mock with conditions', async ({ page }) => {
  await page.route('**/api/**', route => {
    const url = route.request().url();

    if (url.includes('/users/1')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ id: 1, name: 'Test User' }),
      });
    } else if (url.includes('/users')) {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ users: [] }),
      });
    } else {
      route.continue();
    }
  });
});

test('simulate network errors', async ({ page }) => {
  await page.route('**/api/data', route => {
    route.abort('failed');
  });

  await page.goto('/data');
  await expect(page.locator('.error-message')).toBeVisible();
});
```

### Request Interception

```typescript
test('intercept and modify requests', async ({ page }) => {
  // Modify request headers
  await page.route('**/api/**', route => {
    const headers = route.request().headers();
    route.continue({
      headers: {
        ...headers,
        'X-Custom-Header': 'test-value',
      },
    });
  });

  // Modify POST data
  await page.route('**/api/submit', route => {
    const postData = route.request().postDataJSON();
    route.continue({
      postData: JSON.stringify({
        ...postData,
        timestamp: Date.now(),
      }),
    });
  });
});

test('wait for API response', async ({ page }) => {
  // Wait for specific request
  const responsePromise = page.waitForResponse('**/api/users');
  await page.click('button#load-users');
  const response = await responsePromise;

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.users).toHaveLength(10);
});
```

## Test Organization

### Custom Fixtures

```typescript
// fixtures/todos.ts
import { test as base } from '@playwright/test';

type TodoFixtures = {
  todoPage: TodoPage;
  createTodo: (title: string) => Promise<void>;
};

export const test = base.extend<TodoFixtures>({
  todoPage: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await use(todoPage);
  },

  createTodo: async ({ page }, use) => {
    const create = async (title: string) => {
      await page.fill('.new-todo', title);
      await page.press('.new-todo', 'Enter');
    };
    await use(create);
  },
});

// tests/todos.spec.ts
import { test } from '../fixtures/todos';

test('can create new todo', async ({ todoPage, createTodo }) => {
  await createTodo('Buy groceries');
  await expect(todoPage.todoItems).toHaveCount(1);
  await expect(todoPage.todoItems).toHaveText('Buy groceries');
});
```

### Test Tags and Filtering

```typescript
test('smoke test', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Home');
});

test('regression test', { tag: ['@regression', '@critical'] }, async ({ page }) => {
  // Complex test
});

// Run: npx playwright test --grep @smoke
// Run: npx playwright test --grep-invert @slow
```

## Visual Testing

### Screenshot Comparison

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/dashboard');

  // Full page screenshot
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100,
  });

  // Element screenshot
  await expect(page.locator('.widget')).toHaveScreenshot('widget.png');

  // Full page with scroll
  await expect(page).toHaveScreenshot('full-page.png', {
    fullPage: true,
  });

  // Mask dynamic elements
  await expect(page).toHaveScreenshot('masked.png', {
    mask: [page.locator('.timestamp'), page.locator('.avatar')],
  });

  // Custom threshold
  await expect(page).toHaveScreenshot('comparison.png', {
    maxDiffPixelRatio: 0.05, // 5% difference allowed
  });
});
```

### Video and Trace

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});

// Programmatic video
test('record video', async ({ page }) => {
  await page.goto('/');
  // Test actions...

  // Video saved automatically to test-results/
});

// View trace: npx playwright show-trace trace.zip
```

## Parallel Execution

### Test Sharding

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined,
});

// Run shards in CI
// npx playwright test --shard=1/4
// npx playwright test --shard=2/4
// npx playwright test --shard=3/4
// npx playwright test --shard=4/4
```

### Serial Tests

```typescript
test.describe.configure({ mode: 'serial' });

test.describe('order matters', () => {
  let orderId: string;

  test('create order', async ({ page }) => {
    // Create order
    orderId = await createOrder(page);
  });

  test('verify order', async ({ page }) => {
    // Use orderId from previous test
    await verifyOrder(page, orderId);
  });
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
```

## Debugging

### UI Mode

```bash
# Interactive debugging
npx playwright test --ui

# Debug specific test
npx playwright test --debug login.spec.ts

# Step through test
npx playwright test --headed --slow-mo=1000
```

### Trace Viewer

```typescript
// Generate trace
test('with trace', async ({ page }) => {
  await page.context().tracing.start({ screenshots: true, snapshots: true });

  // Test actions
  await page.goto('/');

  await page.context().tracing.stop({ path: 'trace.zip' });
});

// View: npx playwright show-trace trace.zip
```

### Console Logs

```typescript
test('capture console', async ({ page }) => {
  page.on('console', msg => console.log(`Browser: ${msg.text()}`));
  page.on('pageerror', error => console.error(`Error: ${error.message}`));

  await page.goto('/');
});
```

## Best Practices

### 1. Use Stable Locators
```typescript
// ✅ Good - Role-based, stable
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email').fill('test@example.com');

// ❌ Bad - Fragile, implementation-dependent
await page.click('button.btn-primary.submit-btn');
await page.fill('div > form > input:nth-child(3)');
```

### 2. Leverage Auto-Waiting
```typescript
// ✅ Good - Auto-waits
await page.click('button');
await expect(page.locator('.result')).toBeVisible();

// ❌ Bad - Manual waits
await page.waitForTimeout(2000);
await page.click('button');
```

### 3. Use Page Object Model
```typescript
// ✅ Good - Reusable, maintainable
const loginPage = new LoginPage(page);
await loginPage.login('user', 'pass');

// ❌ Bad - Duplicated selectors
await page.fill('[name="username"]', 'user');
await page.fill('[name="password"]', 'pass');
```

### 4. Parallel-Safe Tests
```typescript
// ✅ Good - Isolated
test('user signup', async ({ page }) => {
  const uniqueEmail = `user-${Date.now()}@test.com`;
  await signUp(page, uniqueEmail);
});

// ❌ Bad - Shared state
test('user signup', async ({ page }) => {
  await signUp(page, 'test@test.com'); // Conflicts in parallel
});
```

### 5. Handle Flakiness
```typescript
// ✅ Good - Wait for network idle
await page.goto('/', { waitUntil: 'networkidle' });
await expect(page.locator('.data')).toBeVisible();

// Configure retries
test.describe(() => {
  test.use({ retries: 2 });

  test('flaky test', async ({ page }) => {
    // Test with auto-retry
  });
});
```

## Common Patterns

### Multi-Page Scenarios

```typescript
test('popup handling', async ({ page, context }) => {
  // Listen for new page
  const popupPromise = context.waitForEvent('page');
  await page.click('a[target="_blank"]');
  const popup = await popupPromise;

  await popup.waitForLoadState();
  await expect(popup).toHaveTitle('New Window');
  await popup.close();
});
```

### Conditional Logic

```typescript
test('handle optional elements', async ({ page }) => {
  await page.goto('/');

  // Close modal if present
  const modal = page.locator('.modal');
  if (await modal.isVisible()) {
    await page.click('.modal .close-button');
  }

  // Or use count
  const cookieBanner = page.locator('.cookie-banner');
  if ((await cookieBanner.count()) > 0) {
    await page.click('.accept-cookies');
  }
});
```

### Data-Driven Tests

```typescript
const testCases = [
  { input: 'hello', expected: 'HELLO' },
  { input: 'World', expected: 'WORLD' },
  { input: '123', expected: '123' },
];

for (const { input, expected } of testCases) {
  test(`transforms "${input}" to "${expected}"`, async ({ page }) => {
    await page.goto('/transform');
    await page.fill('input', input);
    await page.click('button');
    await expect(page.locator('.result')).toHaveText(expected);
  });
}
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [GitHub Examples](https://github.com/microsoft/playwright/tree/main/examples)
