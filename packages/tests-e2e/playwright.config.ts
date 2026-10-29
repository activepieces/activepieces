import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { STORAGE_STATE } from './fixtures/api';

// Load environment variables from the .env.e2e file (local dev)
// In CI, use inherited environment variables instead
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });
}

const AP_EDITION = process.env.AP_EDITION || 'ce';
const LOCAL_URL = 'http://localhost:4200';
const E2E_INSTANCE_URL = process.env.E2E_INSTANCE_URL || undefined;

const editionConfigs = {
  ce: {
    testIgnore: ['**/ee/**'],
  },
  ee: {
    testIgnore: [],
  },
};

const editionConfig = editionConfigs[AP_EDITION as keyof typeof editionConfigs];

const QUARANTINE = /@quarantine/;

const config: PlaywrightTestConfig = {
  testDir: './scenarios',
  testMatch: '**/*.spec.ts',
  testIgnore: editionConfig.testIgnore,
  grepInvert: process.env.CI ? QUARANTINE : undefined,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? '100%' : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'html',
  /* Global setup to run once before all tests */
  globalSetup: require.resolve('./global-setup'),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: E2E_INSTANCE_URL ?? LOCAL_URL,

    storageState: STORAGE_STATE,

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
    },
  ],

  /* Run your local dev server before starting the tests, unless they target a deployed instance */
  webServer: E2E_INSTANCE_URL ? undefined : {
    command: process.env.CI
      ? 'npm run dev'
      : 'export $(cat packages/tests-e2e/.env.e2e | xargs) && npm run dev',
    cwd: path.resolve(__dirname, '../..'),
    url: `${LOCAL_URL}/api/v1/flags`,
    reuseExistingServer: !process.env.CI,
    timeout: 300000,
    stdout: 'pipe',
  },
};

export default defineConfig(config);
