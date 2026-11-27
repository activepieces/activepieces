import { expect } from '@playwright/test';
import { BasePage } from './base';

export class McpServerPage extends BasePage {
  url = '/mcp-server';

  async visitTools(): Promise<void> {
    await this.page.goto(`${this.url}/tools`);
  }

  async visitConnections(): Promise<void> {
    await this.page.goto(`${this.url}/connections`);
  }

  tierSwitch(tier: McpToolTier) {
    return this.page.getByTestId(`mcp-tool-tier-${tier}`);
  }

  async turnOffTier(tier: McpToolTier): Promise<void> {
    await this.tierSwitch(tier).click();
    await expect(this.tierSwitch(tier)).not.toBeChecked();
  }

  async turnOnDeleteTier(): Promise<void> {
    await this.tierSwitch('delete').click();
    const dialog = this.page.getByRole('dialog', { name: 'Turn on Delete tools?' });
    await dialog.getByRole('button', { name: 'Turn on' }).click();
    await expect(dialog).toBeHidden();
    await expect(this.tierSwitch('delete')).toBeChecked();
  }

  grantRow(clientName: string) {
    return this.page.getByRole('row').filter({ hasText: clientName });
  }

  async revokeGrant(clientName: string): Promise<void> {
    await this.grantRow(clientName).getByRole('button', { name: 'Revoke' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Revoke access' });
    await dialog.getByRole('button', { name: 'Revoke' }).click();
    await expect(dialog).toBeHidden();
  }

  grantsEmptyState() {
    return this.page.getByTestId('mcp-grants-empty');
  }

  async authorizeOnConsentPage({ authorizeUrl, clientName }: { authorizeUrl: string; clientName: string }): Promise<void> {
    await this.page.goto(authorizeUrl);
    await expect(this.page.getByTestId('mcp-authorize-client-name')).toHaveText(clientName);
    await this.page.getByRole('button', { name: 'Authorize', exact: true }).click();
  }
}

export type McpToolTier = 'read' | 'draft' | 'live' | 'delete';
