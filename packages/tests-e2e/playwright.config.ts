import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the shared .env.e2e file (local dev only)
// In CI, use inherited environment variables instead
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });
}

const AP_EDITION = process.env.AP_EDITION || 'ce';

// Edition-specific configurations
const editionConfigs = {
  ce: {
    testDir: './scenarios/ce',
  },
  cloud: {
    testDir: './scenarios/cloud',
  },
  ee: {
    testDir: './scenarios/ee',
  },
};

const editionConfig = editionConfigs[AP_EDITION as keyof typeof editionConfigs];

const config: PlaywrightTestConfig = {
  testDir: editionConfig.testDir,

  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? '100%' : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Run in headless mode for environments without display server */
    headless: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: `@activepieces/${AP_EDITION}`,
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      testDir: editionConfig.testDir,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI
      ? 'npm run dev'
      : 'export $(cat .env.e2e | xargs) && npm run dev',
    url: 'http://localhost:4200/api/v1/flags',
    reuseExistingServer: !process.env.CI,
    timeout: 100000,
    stdout: 'pipe',
  },
};

export default defineConfig(config);
