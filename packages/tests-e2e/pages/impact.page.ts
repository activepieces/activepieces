import { expect, Locator, Response } from '@playwright/test';
import type { ImpactReport } from '../fixtures/impact';
import { BasePage } from './base';

export class ImpactPage extends BasePage {
  url = '/impact?tab=details';

  async refresh(): Promise<ImpactReport> {
    const refreshed = this.page.waitForResponse(isRefresh, { timeout: REFRESH_TIMEOUT_MS });
    await this.page.getByTestId('impact-refresh').click();
    const response = await refreshed;
    expect(response.status(), 'The analytics refresh failed').toBe(200);
    return response.json();
  }

  async searchFlows(name: string): Promise<void> {
    await this.page.getByTestId('impact-details-search').fill(name);
  }

  timeSavedOf(flowName: string): Locator {
    return this.page.getByRole('row').filter({ hasText: flowName }).getByTestId('impact-details-time-saved');
  }
}

function isRefresh(response: Response): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/analytics/refresh';
}

const REFRESH_TIMEOUT_MS = 60_000;
