import { expect } from '@playwright/test';
import { BasePage } from './base';
import type { McpToolTier } from './mcp-server.page';

export class PlatformMcpPage extends BasePage {
  url = '/platform/mcp';

  async visitTools(): Promise<void> {
    await this.page.goto(this.url);
  }

  async visitActivity({ projectId }: { projectId: string }): Promise<void> {
    await this.page.goto(`${this.url}/activity?project=${projectId}`);
  }

  async openTierTools(tier: McpToolTier): Promise<void> {
    await this.page.getByTestId(`mcp-tool-tier-${tier}-tools`).click();
  }

  toolSwitch(toolName: string) {
    return this.page.getByTestId(`mcp-tool-switch-${toolName}`);
  }

  async turnOffTool({ tier, toolName }: { tier: McpToolTier; toolName: string }): Promise<void> {
    await this.openTierTools(tier);
    await this.toolSwitch(toolName).click();
    await expect(this.toolSwitch(toolName)).not.toBeChecked();
  }

  activityRow(projectName: string) {
    return this.page.getByRole('row').filter({ hasText: projectName });
  }

  activityDetails(actionName: string) {
    return this.page.getByRole('dialog', { name: actionName });
  }
}
