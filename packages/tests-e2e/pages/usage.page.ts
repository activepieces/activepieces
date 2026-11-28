import { expect, Locator, Response } from '@playwright/test';
import { BasePage } from './base';

export class UsagePage extends BasePage {
  url = `/platform/usage?limit=${PAGE_SIZE}`;

  async open(): Promise<void> {
    const listed = this.page.waitForResponse(isProjectsUsageList);
    await this.visit();
    expect((await listed).status(), 'The projects usage request failed').toBe(200);
  }

  async expectProjectRunCredits({ projectName, runs }: { projectName: string; runs: number }): Promise<void> {
    const row = this.projectRow(projectName);
    await expect(async () => {
      await this.open();
      await expect(row.getByTestId('usage-project-runs-credits')).toHaveText(String(runs), { timeout: 1_000 });
    }, `The usage row of ${projectName} never showed ${runs} run credits`).toPass({ timeout: USAGE_TIMEOUT_MS, intervals: [2_000, 5_000] });
    await expect(row.getByTestId('usage-project-ai-credits')).toHaveText('0');
    await expect(row.getByTestId('usage-project-total-credits')).toHaveText(String(runs));
  }

  projectRow(projectName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('button', { name: projectName, exact: true }) });
  }
}

function isProjectsUsageList(response: Response): boolean {
  return response.request().method() === 'GET' && new URL(response.url()).pathname.endsWith('/v1/platform-billing/projects-usage');
}

const PAGE_SIZE = 50;
const USAGE_TIMEOUT_MS = 60_000;
