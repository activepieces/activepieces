import { chromium, FullConfig, Page } from '@playwright/test';
import { AuthenticationPage } from './pages/authentication.page';
import { AutomationsPage } from './pages/automations.page';

export const DEFAULT_EMAIL = 'test@activepieces.com';
export const DEFAULT_PASSWORD = 'TestPassword123!@#';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global setup...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: config.projects[0].use.baseURL,
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

    await new AutomationsPage(page).open();

    if (process.env.E2E_INSTANCE_URL) {
      await deleteAllFlows(page);
    }

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

async function deleteAllFlows(page: Page) {
  const { token, projectId } = await page.evaluate(() => ({
    token: localStorage.getItem('token'),
    projectId: localStorage.getItem('projectId'),
  }));
  const headers = { Authorization: `Bearer ${token}` };

  while (true) {
    const listResponse = await page.request.get('/api/v1/flows', {
      headers,
      params: { projectId: projectId ?? '', limit: 100 },
    });
    if (!listResponse.ok()) {
      throw new Error(`Listing flows to clean up failed with ${listResponse.status()}`);
    }
    const { data }: { data: { id: string }[] } = await listResponse.json();
    if (data.length === 0) {
      return;
    }
    console.log(`✓ Deleting ${data.length} flows left by earlier runs`);
    for (const flow of data) {
      const deleteResponse = await page.request.delete(`/api/v1/flows/${flow.id}`, { headers });
      if (!deleteResponse.ok()) {
        throw new Error(`Deleting flow ${flow.id} failed with ${deleteResponse.status()}`);
      }
    }
  }
}
