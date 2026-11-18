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

  async visitWithErrorMessage(message: string): Promise<void> {
    await this.page.goto(`${this.url}?failedStepMessage=${encodeURIComponent(message)}`);
  }

  async filterByErrorMessage(message: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Error message', exact: true }).click();
    await this.page.getByPlaceholder('Search', { exact: true }).fill(message);
    await this.page.waitForURL((url) => url.searchParams.get('failedStepMessage') === message);
    await this.page.keyboard.press('Escape');
  }

  errorMessageFilter() {
    return this.page.getByRole('button', { name: /^Error message/ });
  }

  async filterByFlowName(flowName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Flow name', exact: true }).click();
    await this.page.getByPlaceholder('Flow name', { exact: true }).fill(flowName);
    await this.page.getByRole('option', { name: flowName, exact: true }).click();
    await this.page.waitForURL((url) => url.searchParams.has('flowId'));
    await this.page.keyboard.press('Escape');
  }

  async nextPage(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  rows(flowName: string) {
    return this.page.getByRole('row').filter({ hasText: flowName });
  }

  emptyState() {
    return this.page.getByTestId('data-table-empty-state');
  }

  async selectRunsOf(flowName: string): Promise<void> {
    await this.rows(flowName).getByRole('checkbox').click();
  }

  async retrySelectedOnLatestVersion(): Promise<string[]> {
    const retried = this.page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/flow-runs/retry');
    await this.page.getByRole('button', { name: /^Retry \(\d+\)/ }).click();
    await this.page.getByRole('menuitem', { name: 'on latest version' }).click();
    const response = await retried;
    expect(response.ok(), `The bulk retry failed with ${response.status()}: ${await response.text()}`).toBe(true);
    const runs: { id: string; error?: unknown }[] = await response.json();
    expect(runs.filter((run) => run.error !== undefined), 'Runs the server could not retry').toEqual([]);
    return runs.map((run) => run.id);
  }

  async viewRetriedRuns(): Promise<void> {
    await this.page.getByRole('button', { name: 'View', exact: true }).click();
    await this.page.waitForURL((url) => url.searchParams.has('flowRunIds'));
  }
}
