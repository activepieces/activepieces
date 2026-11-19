import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class VariablesPage extends BasePage {
  url = '/variables';

  async open(): Promise<Response> {
    const listed = this.page.waitForResponse(isVariablesList);
    await this.visit();
    return listed;
  }

  async openFilteredBy({ name }: { name: string }): Promise<Response> {
    const listed = this.page.waitForResponse(isVariablesList);
    await this.page.goto(`${this.url}?name=${encodeURIComponent(name)}`);
    return listed;
  }

  async reload(): Promise<Response> {
    const listed = this.page.waitForResponse(isVariablesList);
    await this.page.reload();
    return listed;
  }

  async create({ name, value }: { name: string; value: string }): Promise<{ id: string }> {
    const response = await this.submitNewVariable({ name, value });
    expect(response.ok(), `Creating the variable failed with ${response.status()}: ${await response.text()}`).toBe(true);
    await expect(this.dialog('New variable')).toBeHidden();
    const variable: { id: string } = await response.json();
    return { id: variable.id };
  }

  async expectCreateRefused({ name, value, message }: { name: string; value: string; message: string }): Promise<void> {
    const response = await this.submitNewVariable({ name, value });
    expect(response.status()).toBe(409);
    await expect(this.dialog('New variable').getByText(message, { exact: true })).toBeVisible();
  }

  async rotate({ name, value }: { name: string; value: string }): Promise<void> {
    await this.rowAction({ name, action: 'Edit' });
    const dialog = this.dialog('Edit variable');
    await dialog.getByRole('button', { name: 'Rotate value', exact: true }).click();
    await dialog.getByLabel('Value', { exact: true }).fill(value);
    const saved = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && VARIABLE_PATH.test(new URL(response.url()).pathname),
    );
    await dialog.getByRole('button', { name: 'Save new value', exact: true }).click();
    const response = await saved;
    expect(response.ok(), `Rotating the value failed with ${response.status()}`).toBe(true);
    await expect(dialog).toBeHidden();
  }

  async delete({ name }: { name: string }): Promise<void> {
    await this.rowAction({ name, action: 'Delete' });
    const deleted = this.page.waitForResponse(
      (response) => response.request().method() === 'DELETE' && VARIABLE_PATH.test(new URL(response.url()).pathname),
    );
    await this.dialog('Delete variable').getByRole('button', { name: 'Remove', exact: true }).click();
    const response = await deleted;
    expect(response.ok(), `Deleting the variable failed with ${response.status()}`).toBe(true);
  }

  async bulkDelete({ names }: { names: string[] }): Promise<void> {
    for (const name of names) {
      await this.row(name).getByRole('checkbox').click();
    }
    await this.page.getByRole('button', { name: `Delete (${names.length})`, exact: true }).click();
    const dialog = this.dialog('Delete variables');
    const relisted = this.page.waitForResponse(isVariablesList);
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await relisted;
    await expect(dialog).toBeHidden();
  }

  async filterByName(name: string): Promise<void> {
    const trigger = this.page.getByRole('button', { name: /^Name/ });
    await trigger.click();
    const listed = this.page.waitForResponse((response) => isVariablesList(response) && new URL(response.url()).searchParams.get('name') === name);
    await this.page.getByPlaceholder('Search', { exact: true }).fill(name);
    await listed;
    await this.page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }

  async filterByOwner({ label, email }: { label: string; email: string }): Promise<void> {
    await this.page.getByRole('button', { name: /^Owner/ }).click();
    await this.page.getByPlaceholder('Owner', { exact: true }).fill(email);
    await this.page.getByRole('option', { name: label, exact: true }).click();
    await this.page.waitForURL((url) => url.searchParams.getAll('owner').includes(email));
    await this.page.keyboard.press('Escape');
  }

  async nextPage(): Promise<void> {
    const listed = this.page.waitForResponse(isVariablesList);
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
    await listed;
  }

  async previousPage(): Promise<void> {
    const listed = this.page.waitForResponse(isVariablesList);
    await this.page.getByRole('button', { name: 'Previous', exact: true }).click();
    await listed;
  }

  async expectRetrySucceeds(): Promise<void> {
    const listed = this.page.waitForResponse(isVariablesList);
    await this.retryAfterError();
    expect((await listed).status()).toBe(200);
    await expect(this.errorState()).toBeHidden();
  }

  async insertFromDataSelector({ input, name }: { input: string; name: string }): Promise<void> {
    await this.page.getByTestId('right-sidebar').getByRole('textbox', { name: input, exact: true }).click();
    await this.page.getByRole('tab', { name: 'Variables', exact: true }).click();
    const mention = `{{variables['${name}']}}`;
    const saved = this.page.waitForRequest(
      (request) => request.method() === 'POST' && FLOW_PATH.test(new URL(request.url()).pathname) && (request.postData() ?? '').includes(mention),
    );
    await this.page.getByRole('button', { name, exact: true }).click();
    const request = await saved;
    expect((await request.response())?.ok(), 'Saving the step with the variable failed').toBe(true);
  }

  async shownNames({ names }: { names: string[] }): Promise<string[]> {
    const texts = await this.page.getByRole('row').allInnerTexts();
    return names.filter((name) => texts.some((text) => text.includes(name)));
  }

  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  rowsMatching(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }

  emptyState(): Locator {
    return this.page.getByTestId('data-table-empty-state');
  }

  private async submitNewVariable({ name, value }: { name: string; value: string }): Promise<Response> {
    await this.page.getByRole('button', { name: 'New variable', exact: true }).click();
    const dialog = this.dialog('New variable');
    await dialog.getByLabel('Name', { exact: true }).fill(name);
    await dialog.getByLabel('Value', { exact: true }).fill(value);
    const created = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/variables',
    );
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    return created;
  }

  private async rowAction({ name, action }: { name: string; action: 'Edit' | 'Delete' }): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Open menu', exact: true }).click();
    await this.page.getByRole('menuitem', { name: action, exact: true }).click();
  }

  private dialog(title: string): Locator {
    return this.page.getByRole('dialog', { name: title });
  }
}

function isVariablesList(response: Response): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/v1/variables';
}

const VARIABLE_PATH = /^\/api\/v1\/variables\/[^/]+$/;
const FLOW_PATH = /^\/api\/v1\/flows\/[^/]+$/;
