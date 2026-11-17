import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium, FullConfig, Page } from '@playwright/test';
import { AuthenticationPage } from './pages/authentication.page';
import { e2eApi, STORAGE_STATE } from './fixtures/api';

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

    await authPage.waitForSignedIn();
    mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
    await context.storageState({ path: STORAGE_STATE });
    const session = e2eApi.readSession();

    if (process.env.E2E_PIECES_MANIFEST) {
      await installPieceArchives({ page, token: session.token, manifestPath: process.env.E2E_PIECES_MANIFEST });
    }

    const deleted = await e2eApi.deleteStaleData({ request: page.request, session });
    if (deleted.flows + deleted.connections > 0) {
      console.log(`✓ Deleted ${deleted.flows} flows and ${deleted.connections} connections that crashed runs left behind`);
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

async function installPieceArchives({ page, token, manifestPath }: { page: Page; token: string; manifestPath: string }) {
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

export const DEFAULT_EMAIL = 'test@activepieces.com';
export const DEFAULT_PASSWORD = 'TestPassword123!@#';
