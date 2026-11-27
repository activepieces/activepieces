import { expect, Locator } from '@playwright/test';
import { BasePage } from './base';

export class ConnectionsPage extends BasePage {
  url = '/connections';

  async visitWithName(name: string): Promise<void> {
    await this.page.goto(`${this.url}?displayName=${encodeURIComponent(name)}`);
  }

  async filterByName(name: string): Promise<void> {
    await this.nameFilter().click();
    await this.page.getByPlaceholder('Search', { exact: true }).fill(name);
    await this.page.waitForURL((url) => url.searchParams.get('displayName') === name);
    await this.page.keyboard.press('Escape');
  }

  nameFilter(): Locator {
    return this.page.getByRole('button', { name: /^Name/ });
  }

  async nextPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  row(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  rowsMatching(prefix: string): Locator {
    return this.page.getByRole('row').filter({ hasText: prefix });
  }

  emptyState(): Locator {
    return this.page.getByTestId('data-table-empty-state');
  }

  async openConnectDialog(pieceName: string): Promise<Locator> {
    await this.page.getByRole('button', { name: 'New Connection', exact: true }).click();
    const piecePicker = this.page.getByRole('dialog', { name: 'New Connection' });
    await piecePicker.getByTestId('new-connection-search').fill(pieceName);
    await piecePicker.getByRole('button', { name: pieceName, exact: true }).click();
    return this.page.getByRole('dialog', { name: /^Connect to / });
  }

  async fillConnection({ dialog, name, fields }: { dialog: Locator; name: string; fields: Record<string, string> }): Promise<void> {
    await dialog.getByLabel('Connection Name').fill(name);
    for (const [label, value] of Object.entries(fields)) {
      await dialog.getByLabel(label).fill(value);
    }
  }

  async createConnection({ pieceName, name, fields }: { pieceName: string; name: string; fields: Record<string, string> }): Promise<string> {
    const dialog = await this.openConnectDialog(pieceName);
    await this.fillConnection({ dialog, name, fields });
    const created = this.page.waitForResponse(
      (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/app-connections',
    );
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await created;
    expect(response.ok(), `Creating the connection failed with ${response.status()}`).toBe(true);
    await expect(dialog).toBeHidden();
    const connection: { id: string } = await response.json();
    return connection.id;
  }

  async renameConnection({ from, to }: { from: string; to: string }): Promise<void> {
    await this.row(from).getByTestId('connection-rename').click();
    const dialog = this.page.getByRole('dialog', { name: 'Rename Connection' });
    await dialog.getByLabel('Name').fill(to);
    await dialog.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async selectConnections(names: string[]): Promise<void> {
    for (const name of names) {
      await this.row(name).getByRole('checkbox').click();
    }
  }

  async deleteSelected(): Promise<void> {
    await this.page.getByRole('button', { name: /^Delete \(\d+\)$/ }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Delete Connections' });
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}
