import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class EventStreamingPage extends BasePage {
  url = '/platform/audit-log/streaming';

  async expectLiveDestinations(): Promise<void> {
    const listed = this.page.waitForResponse((response) => response.request().method() === 'GET' && isDestinationsPath(response), { timeout: LIVE_LIST_TIMEOUT_MS }).catch(() => {
      throw new Error(`The page sent no destinations request in ${LIVE_LIST_TIMEOUT_MS} ms: a plan without eventStreamingEnabled shows sample destinations`);
    });
    await this.visit();
    expect((await listed).status(), 'The destinations request failed').toBe(200);
  }

  async startWebhookDestination({ event }: { event: string }): Promise<void> {
    await this.page.getByRole('link', { name: 'New Destination' }).click();
    await this.page.getByRole('radio', { name: /Send to a webhook/ }).click();
    await this.continue();
    await this.page.getByPlaceholder('Search events').fill(event);
    await this.page.getByRole('checkbox', { name: event, exact: true }).check();
    await this.continue();
  }

  urlField(): Locator {
    return this.page.getByRole('textbox', { name: 'Use your own webhook URL' });
  }

  async createDestination(): Promise<string> {
    const created = this.page.waitForResponse((response) => response.request().method() === 'POST' && isDestinationsPath(response));
    await this.submit();
    const response = await created;
    expect(response.ok(), `Creating the destination failed with ${response.status()}`).toBe(true);
    const destination: { id: string } = await response.json();
    await this.page.waitForURL((url) => url.pathname === this.url);
    return destination.id;
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Create destination', exact: true }).click();
  }

  async deleteDestination(url: string): Promise<void> {
    await this.row(url).getByRole('button', { name: 'Open menu' }).click();
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Delete destination' });
    const deleted = this.page.waitForResponse((response) => response.request().method() === 'DELETE' && new URL(response.url()).pathname.startsWith('/api/v1/event-destinations/'));
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    expect((await deleted).ok()).toBe(true);
    await expect(dialog).toBeHidden();
  }

  countCreateRequests(): () => number {
    let count = 0;
    this.page.on('request', (request) => {
      count += request.method() === 'POST' && new URL(request.url()).pathname === DESTINATIONS_PATH ? 1 : 0;
    });
    return () => count;
  }

  row(url: string): Locator {
    return this.page.getByRole('row').filter({ hasText: url });
  }

  private async continue(): Promise<void> {
    await this.page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
}

function isDestinationsPath(response: Response): boolean {
  return new URL(response.url()).pathname === DESTINATIONS_PATH;
}

const DESTINATIONS_PATH = '/api/v1/event-destinations';
const LIVE_LIST_TIMEOUT_MS = 15_000;
