import { chromium } from '@playwright/test';
import { AuthenticationPage } from './pages/authentication.page';

export const DEFAULT_EMAIL = 'test@activepieces.com';
export const DEFAULT_PASSWORD = 'TestPassword123!@#';

async function globalSetup() {
  console.log('🔧 Running global setup...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: process.env.AP_FRONTEND_URL,
  });
  const page = await context.newPage();

  const authPage = new AuthenticationPage(page);

  try {
    if (process.env.E2E_EMAIL && process.env.E2E_PASSWORD) {
      console.log('✓ Using credentials from environment variables for sign-in');
      await authPage.signIn({
        email: process.env.E2E_EMAIL,
        password: process.env.E2E_PASSWORD,
      });
    } else {
      console.log('✓ Using default credentials for sign-up');
      await authPage.signUp({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
        firstName: 'Test',
        lastName: 'User',
      });
    }

    // Wait for successful authentication (redirect to flows page or dashboard)
    await page.waitForURL('**/flows', { timeout: 15000 });

    console.log('✓ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;

