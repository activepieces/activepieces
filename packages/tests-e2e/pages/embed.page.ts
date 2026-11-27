import { expect } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';
import type { SigningKey } from '../fixtures/embed';
import { BasePage } from './base';

export class EmbedPage extends BasePage {
  url = '/platform/embedding';

  async visitSigningKeys() {
    await this.page.route(isPlatformRequest, withAllowedOrigin);
    await this.visit();
    await expect(this.newSigningKeyButton()).toBeVisible();
  }

  async reload() {
    await this.page.reload();
    await expect(this.newSigningKeyButton()).toBeVisible();
  }

  async createSigningKey({ displayName, onCreated }: { displayName: string; onCreated: (signingKeyId: string) => void }): Promise<SigningKey> {
    await this.newSigningKeyButton().click();
    await this.page.getByRole('dialog', { name: 'Create Signing Key' }).getByTestId('embedding-signing-key-name').fill(displayName);
    const created = this.page.waitForResponse((response) => response.request().method() === 'POST' && SIGNING_KEYS_PATH.test(new URL(response.url()).pathname));
    await this.page.getByTestId('embedding-signing-key-save').click();
    const response = await created;
    expect(response.status(), 'Creating the signing key failed').toBe(201);
    const signingKey: SigningKey = await response.json();
    onCreated(signingKey.id);
    await this.page.getByRole('dialog', { name: 'Signing Key Created' }).getByRole('button', { name: 'Done' }).click();
    await expect(this.page.getByRole('dialog')).toBeHidden();
    return { id: signingKey.id, displayName: signingKey.displayName, privateKey: signingKey.privateKey };
  }

  async deleteSigningKey(displayName: string) {
    await this.signingKeyRow(displayName).getByTestId('embedding-signing-key-actions').click();
    await this.page.getByRole('menuitem', { name: 'Delete Signing Key' }).click();
    const deleted = this.page.waitForResponse((response) => response.request().method() === 'DELETE' && new URL(response.url()).pathname.startsWith('/api/v1/signing-keys/'));
    await this.page.getByRole('dialog', { name: 'Delete Signing Key' }).getByRole('button', { name: 'Delete', exact: true }).click();
    expect((await deleted).status()).toBe(200);
  }

  signingKeyRow(displayName: string): Locator {
    return this.page.getByRole('group', { name: displayName, exact: true });
  }

  private newSigningKeyButton(): Locator {
    return this.page.getByTestId('embedding-signing-key-new');
  }
}

export class EmbeddedBuilderPage {
  constructor(public readonly page: Page) {}

  async open({ token, initialRoute, disableNavigation }: { token: string; initialRoute: string; disableNavigation: boolean }): Promise<{ projectId: string }> {
    const vendorInit = {
      type: 'VENDOR_INIT',
      data: {
        jwtToken: token,
        initialRoute,
        disableNavigationInBuilder: disableNavigation,
        hideSidebar: false,
        hideFlowNameInBuilder: false,
        hideConnectionsInBuilder: true,
        locale: 'en',
      },
    };
    await this.page.route((url) => url.pathname === HOST_PATH, (route) => route.fulfill({ contentType: 'text/html', body: hostHtml(vendorInit) }));
    const exchanged = this.page.waitForResponse((response) => new URL(response.url()).pathname === EXCHANGE_PATH);
    await this.page.goto(HOST_PATH);
    const response = await exchanged;
    expect(response.status(), 'The embed could not exchange its token').toBe(200);
    const embedded: { projectId: string } = await response.json();
    return { projectId: embedded.projectId };
  }

  step(stepName: string): Locator {
    return this.frame().getByTestId(`rf__node-${stepName}`);
  }

  flowName(): Locator {
    return this.frame().getByTestId('builder-flow-name');
  }

  homeButton(): Locator {
    return this.frame().getByTestId('builder-home-button');
  }

  private frame() {
    return this.page.getByTestId('e2e-embed-frame').contentFrame();
  }
}

function isPlatformRequest(url: URL): boolean {
  return PLATFORM_PATH.test(url.pathname);
}

async function withAllowedOrigin(route: Route) {
  if (route.request().method() !== 'GET') {
    await route.fallback();
    return;
  }
  const response = await route.fetch();
  const platform: { allowedEmbedOrigins: string[] } = await response.json();
  await route.fulfill({ response, json: { ...platform, allowedEmbedOrigins: [...platform.allowedEmbedOrigins, ALLOWED_ORIGIN] } });
}

function hostHtml(vendorInit: unknown): string {
  return `<!doctype html>
<html>
  <body style="margin:0">
    <script>
      const vendorInit = ${JSON.stringify(vendorInit).replaceAll('<', '\\u003c')};
      const frame = document.createElement('iframe');
      frame.dataset.testid = 'e2e-embed-frame';
      frame.style.cssText = 'width:100%;height:100vh;border:0';
      frame.src = '/embed?currentDate=' + Date.now();
      window.addEventListener('message', (event) => {
        if (event.source === frame.contentWindow && event.data.type === 'CLIENT_INIT') {
          frame.contentWindow.postMessage(vendorInit, '*');
        }
      });
      document.body.appendChild(frame);
    </script>
  </body>
</html>`;
}

const PLATFORM_PATH = /^\/api\/v1\/platforms\/[^/]+$/;
const SIGNING_KEYS_PATH = /^\/api\/v1\/signing-keys\/?$/;
const EXCHANGE_PATH = '/api/v1/managed-authn/external-token';
const HOST_PATH = '/e2e-embed-host';
const ALLOWED_ORIGIN = 'https://e2e-embed-host.example.com';
