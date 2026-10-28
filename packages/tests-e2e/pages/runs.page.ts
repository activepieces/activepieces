import { expect } from '@playwright/test';
import { BasePage } from './base';

export class RunsPage extends BasePage {
  url = `/runs`;

  async expectLatestRun({ flowId, flowName, status, timeout = 60000 }: { flowId: string; flowName: string; status: string; timeout?: number }) {
    const latestRun = this.page.getByRole('row').filter({ hasText: flowName }).first();
    await expect(async () => {
      await this.page.goto(`${this.url}?flowId=${flowId}`);
      await expect(latestRun).toContainText(status, { timeout: 5000 });
    }).toPass({ timeout });
  }

  async openLatestRun({ flowId, flowName, status }: { flowId: string; flowName: string; status: string }) {
    await this.expectLatestRun({ flowId, flowName, status });
    await this.page.getByRole('row').filter({ hasText: flowName }).first().click();
    await this.page.waitForURL(/\/runs\/[^/?#]+/);
  }
}
