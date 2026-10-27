import { expect } from '@playwright/test';
import { BasePage } from './base';

export class RunsPage extends BasePage {
  url = `/runs`;

  async expectLatestRun({ flowId, flowName, status }: { flowId: string; flowName: string; status: string }) {
    const latestRun = this.page.getByRole('row').filter({ hasText: flowName }).first();
    await expect(async () => {
      await this.page.goto(`${this.url}?flowId=${flowId}`);
      await expect(latestRun).toContainText(status, { timeout: 5000 });
    }).toPass({ timeout: 60000 });
  }
}
