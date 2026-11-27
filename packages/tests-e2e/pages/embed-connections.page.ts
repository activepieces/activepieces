import { expect } from '@playwright/test';
import type { FrameLocator, Locator, Response } from '@playwright/test';
import { EmbeddedBuilderPage } from './embed.page';

export class EmbedConnectionsPage extends EmbeddedBuilderPage {
  async openConnect({ token, pieceName, connectionName }: { token: string; pieceName: string; connectionName: string }): Promise<{ projectId: string }> {
    const query = `pieceName=${encodeURIComponent(pieceName)}&randomId=${Date.now()}&connectionName=${encodeURIComponent(connectionName)}`;
    const opened = await this.open({ token, initialRoute: `/embed/connections?${query}`, disableNavigation: false });
    await expect(this.connectDialog()).toBeVisible();
    return opened;
  }

  async saveConnection({ fields, onCreated }: { fields: Record<string, string>; onCreated: (connectionId: string) => void }): Promise<ConnectResult> {
    const dialog = this.connectDialog();
    for (const [label, value] of Object.entries(fields)) {
      await dialog.getByLabel(label).fill(value);
    }
    const connectResult = this.page.evaluate((type) => new Promise<ConnectResult>((resolve) => {
      window.addEventListener('message', (event: MessageEvent<{ type: string; data: ConnectResult }>) => {
        if (event.data.type === type) {
          resolve(event.data.data);
        }
      });
    }), DIALOG_CLOSED_EVENT);
    const created = this.page.waitForResponse(isConnectionCreate);
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    const response = await created;
    expect(response.ok(), `Creating the connection failed with ${response.status()}`).toBe(true);
    const connection: { id: string } = await response.json();
    onCreated(connection.id);
    await expect(dialog).toBeHidden();
    return connectResult;
  }

  async openMcpTools({ token }: { token: string }): Promise<{ projectId: string }> {
    const opened = await this.open({ token, initialRoute: '/embed/mcp', disableNavigation: false });
    await this.content().getByRole('tab', { name: 'Tools', exact: true }).click();
    return opened;
  }

  mcpFlowToolNames(): Locator {
    return this.content().getByTestId('mcp-flow-name');
  }

  async openFlow({ token, flowId }: { token: string; flowId: string }): Promise<void> {
    await this.open({ token, initialRoute: `/flows/${flowId}`, disableNavigation: false });
    await expect(this.step('trigger')).toBeVisible();
  }

  async selectConnection({ stepName, connectionName }: { stepName: string; connectionName: string }): Promise<void> {
    await this.step(stepName).click();
    await this.connectionSelect().click();
    await this.content().getByRole('option', { name: connectionName }).click();
  }

  connectionSelect(): Locator {
    return this.content().getByTestId('right-sidebar').getByRole('combobox', { name: 'Connection' });
  }

  private connectDialog(): Locator {
    return this.content().getByRole('dialog', { name: /^Connect to / });
  }

  private content(): FrameLocator {
    return this.page.getByTestId('e2e-embed-frame').contentFrame();
  }
}

function isConnectionCreate(response: Response): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/app-connections';
}

const DIALOG_CLOSED_EVENT = 'CLIENT_NEW_CONNECTION_DIALOG_CLOSED';

export type ConnectResult = { connection?: { id: string; name: string } };
