import { expect, Locator } from '@playwright/test';
import { BasePage } from './base';

export class PlatformConnectionsPage extends BasePage {
  url = '/platform/connections';

  async visitGlobal(): Promise<void> {
    await this.page.goto(GLOBAL_URL);
  }

  async createGlobalConnection({ pieceName, name, fields, project }: {
    pieceName: string;
    name: string;
    fields: Record<string, string>;
    project: string;
  }): Promise<string> {
    await this.page.getByRole('button', { name: 'New Connection', exact: true }).click();
    const piecePicker = this.page.getByRole('dialog', { name: 'New Connection' });
    await piecePicker.getByTestId('new-connection-search').fill(pieceName);
    await piecePicker.getByRole('button', { name: pieceName, exact: true }).click();
    const dialog = this.page.getByRole('dialog', { name: /^Connect to / });
    await dialog.getByLabel('Connection Name').fill(name);
    for (const [label, value] of Object.entries(fields)) {
      await dialog.getByLabel(label).fill(value);
    }
    await dialog.getByTestId('project-selector').getByRole('combobox').click();
    await this.page.getByRole('option', { name: project, exact: true }).click();
    await this.page.keyboard.press('Escape');
    const created = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/global-connections',
    );
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await created;
    expect(response.ok(), `Creating the global connection failed with ${response.status()}`).toBe(true);
    await expect(dialog).toBeHidden();
    const connection: { id: string } = await response.json();
    return connection.id;
  }

  async pickConnectionInStep(name: string): Promise<void> {
    await this.page.getByTestId('right-sidebar').getByRole('combobox', { name: 'Connection' }).click();
    await this.page.getByRole('option', { name }).click();
  }

  async filterByName(name: string): Promise<void> {
    await this.page.getByRole('button', { name: /^Name/ }).click();
    await this.page.getByPlaceholder('Search', { exact: true }).fill(name);
    await this.page.waitForURL((url) => url.searchParams.get('displayName') === name);
    await this.page.keyboard.press('Escape');
  }

  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  rowsMatching(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text });
  }
}

const GLOBAL_URL = '/platform/connections/global';
