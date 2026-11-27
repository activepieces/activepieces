import { randomUUID, sign } from 'node:crypto';
import { expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { e2eApi, SeededFlow } from './api';
import { test as base } from './index';
import webhookEcho from './templates/webhook-echo.json';

export const test = base.extend<{ embed: Embed }>({
  embed: async ({ browser, baseURL, request, session, cleanup, seed }, use) => {
    const hostContexts: BrowserContext[] = [];

    await use({
      uniqueKeyName: () => e2eApi.uniqueName('signing key'),
      createSigningKey: async () => {
        const signingKey = await e2eApi.callApi<SigningKey>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/signing-keys',
          data: { displayName: e2eApi.uniqueName('signing key') },
        });
        cleanup.track({ resource: 'signing-keys', id: signingKey.id });
        return { id: signingKey.id, displayName: signingKey.displayName, privateKey: signingKey.privateKey };
      },
      signToken: ({ signingKey }) => signToken({ signingKey, identity: newIdentity() }),
      exchange: async ({ token }) => {
        const response = await request.post(EXCHANGE_PATH, { data: { externalAccessToken: token } });
        expect(response.status(), `The token exchange failed: ${await response.text()}`).toBe(200);
        const embedded: { id: string; projectId: string } = await response.json();
        cleanup.track({ resource: 'projects', id: embedded.projectId });
        cleanup.track({ resource: 'users', id: embedded.id });
        return { userId: embedded.id, projectId: embedded.projectId };
      },
      exchangeStatus: async ({ token }) => (await request.post(EXCHANGE_PATH, { data: { externalAccessToken: token } })).status(),
      seedFlow: ({ projectId }) => seed.flow({ template: webhookEcho, publish: false, session: { token: session.token, projectId } }),
      hostPage: async () => {
        const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
        hostContexts.push(context);
        return context.newPage();
      },
    });

    for (const context of hostContexts) {
      await context.close();
    }
  },
});

export { expect } from '@playwright/test';

function newIdentity(): EmbeddedIdentity {
  return {
    externalUserId: `e2e-embed-user-${randomUUID()}`,
    externalProjectId: e2eApi.uniqueName('embed project'),
  };
}

function signToken({ signingKey, identity }: { signingKey: SigningKey; identity: EmbeddedIdentity }): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: signingKey.id };
  const payload = { ...identity, firstName: 'E2E', lastName: 'Embedded', iat: issuedAt, exp: issuedAt + TOKEN_LIFETIME_SECONDS };
  const unsigned = `${base64Url(header)}.${base64Url(payload)}`;
  const signature = sign('sha256', Buffer.from(unsigned), signingKey.privateKey).toString('base64url');
  return `${unsigned}.${signature}`;
}

function base64Url(part: object): string {
  return Buffer.from(JSON.stringify(part)).toString('base64url');
}

const EXCHANGE_PATH = '/api/v1/managed-authn/external-token';
const TOKEN_LIFETIME_SECONDS = 10 * 60;

type EmbeddedIdentity = { externalUserId: string; externalProjectId: string };

export type SigningKey = { id: string; displayName: string; privateKey: string };

export type Embed = {
  uniqueKeyName: () => string;
  createSigningKey: () => Promise<SigningKey>;
  signToken: (params: { signingKey: SigningKey }) => string;
  exchange: (params: { token: string }) => Promise<{ userId: string; projectId: string }>;
  exchangeStatus: (params: { token: string }) => Promise<number>;
  seedFlow: (params: { projectId: string }) => Promise<SeededFlow>;
  hostPage: () => Promise<Page>;
};
