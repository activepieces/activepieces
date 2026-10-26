import { readFileSync } from 'node:fs';
import path from 'node:path';
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

    if (process.env.E2E_PIECES_MANIFEST) {
      await installPieceArchives(page, process.env.E2E_PIECES_MANIFEST);
    }

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

async function installPieceArchives(page: Page, manifestPath: string) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const pieces: { name: string; version: string; filename: string }[] = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  for (const piece of pieces) {
    const response = await page.request.post('/api/v1/pieces', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        packageType: 'ARCHIVE',
        scope: 'PLATFORM',
        pieceName: piece.name,
        pieceVersion: piece.version,
        pieceArchive: {
          name: piece.filename,
          mimeType: 'application/gzip',
          buffer: readFileSync(path.join(path.dirname(manifestPath), piece.filename)),
        },
      },
    });
    if (!response.ok()) {
      throw new Error(`Installing ${piece.name}@${piece.version} failed with ${response.status()}: ${await response.text()}`);
    }
    console.log(`✓ Installed ${piece.name}@${piece.version} from its archive`);
  }
}
