import { expect, Locator, Request, Response } from '@playwright/test';
import { BasePage } from './base';

export class ApiKeysPage extends BasePage {
  url = '/platform/api-keys';

  async open(): Promise<void> {
    const listed = this.page.waitForResponse(isKeysList, { timeout: LIVE_LIST_TIMEOUT_MS }).catch(() => {
      throw new Error(`The page sent no API keys request in ${LIVE_LIST_TIMEOUT_MS} ms: a plan without apiKeysEnabled shows sample data`);
    });
    await this.visit();
    expect((await listed).status(), 'The API keys request failed').toBe(200);
  }

  async reload(): Promise<string[]> {
    const listed = this.page.waitForResponse(isKeysList);
    await this.page.reload();
    const response = await listed;
    expect(response.status(), 'The API keys request failed').toBe(200);
    const keys: { data: { id: string }[] } = await response.json();
    return keys.data.map((key) => key.id);
  }

  async openCreateDialog(): Promise<void> {
    await this.page.getByRole('button', { name: 'New API Key', exact: true }).click();
    await expect(this.createDialog()).toBeVisible();
  }

  async submitName(name: string): Promise<void> {
    await this.nameInput().fill(name);
    await this.createDialog().getByRole('button', { name: 'Create', exact: true }).click();
  }

  async confirmName(name: string): Promise<{ id: string; value: string }> {
    const created = this.page.waitForResponse((response) => isKeyCreate(response.request()));
    await this.submitName(name);
    const response = await created;
    expect(response.status(), 'Creating the API key failed').toBe(201);
    const { id }: { id: string } = await response.json();
    const value = await this.createdDialog().getByRole('textbox').inputValue();
    await this.createdDialog().getByRole('button', { name: 'Done', exact: true }).click();
    await expect(this.createdDialog()).toBeHidden();
    return { id, value };
  }

  async revoke(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Actions', exact: true }).click();
    await this.page.getByRole('menuitem', { name: 'Revoke API Key', exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Revoke API Key' });
    const deleted = this.page.waitForResponse((response) => response.request().method() === 'DELETE' && KEY_PATH.test(new URL(response.url()).pathname));
    await dialog.getByRole('button', { name: 'Revoke', exact: true }).click();
    expect((await deleted).status(), 'Revoking the API key failed').toBe(200);
    await expect(dialog).toBeHidden();
  }

  async expectNameMissing(): Promise<void> {
    expect(await this.nameInput().evaluate((input) => input instanceof HTMLInputElement && input.validity.valueMissing)).toBe(true);
  }

  countKeyCreates(): () => number {
    const creates: Request[] = [];
    this.page.on('request', (request) => {
      if (isKeyCreate(request)) {
        creates.push(request);
      }
    });
    return () => creates.length;
  }

  createDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Create API Key' });
  }

  row(name: string): Locator {
    return this.page.getByRole('group', { name, exact: true });
  }

  private createdDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'API Key Created' });
  }

  private nameInput(): Locator {
    return this.createDialog().getByTestId('api-keys-name-input');
  }
}

function isKeysList(response: Response): boolean {
  return response.request().method() === 'GET' && KEYS_PATH.test(new URL(response.url()).pathname);
}

function isKeyCreate(request: Request): boolean {
  return request.method() === 'POST' && KEYS_PATH.test(new URL(request.url()).pathname);
}

const KEYS_PATH = /^\/api\/v1\/api-keys\/?$/;
const KEY_PATH = /^\/api\/v1\/api-keys\/[^/]+$/;
const LIVE_LIST_TIMEOUT_MS = 15_000;
