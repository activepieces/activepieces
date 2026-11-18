import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { BuilderPage } from './builder.page';

export class RunDetailsPage extends BuilderPage {
  url = `/runs`;

  async open(runId: string) {
    await this.page.goto(`${this.url}/${runId}`);
  }

  async expectRunStatus(status: 'Run Succeeded' | 'Run Failed') {
    await expect(this.page.getByText(status, { exact: true })).toBeVisible({ timeout: RUN_TIMEOUT_MS });
  }

  async openStepInput(stepName: string) {
    await this.openStep(stepName);
    await this.sidebar().getByRole('tab', { name: 'Input', exact: true }).click();
  }

  async expectStepInput({ key, value }: { key: string; value: string }) {
    await expect(this.stepOutput()).toContainText(new RegExp(`${key}:?\\s*${value}`));
  }

  async expectStepError(message: string) {
    await expect(this.sidebar().getByText(message, { exact: true })).toBeVisible();
  }

  async downloadStepFile(): Promise<string> {
    const download = this.page.waitForEvent('download');
    await this.sidebar().getByRole('button', { name: 'Download File', exact: true }).click();
    const file = await (await download).path();
    return readFile(file, 'utf-8');
  }

  async retry(strategy: 'On latest version' | 'From failed step'): Promise<string> {
    await this.page.getByRole('button', { name: 'Runs', exact: true }).click();
    const retried = this.page.waitForResponse((response) => response.request().method() === 'POST' && RETRY_PATH.test(new URL(response.url()).pathname));
    await this.page.getByTestId('flow-run-card-retry').click();
    await this.page.getByRole('menuitem', { name: strategy, exact: true }).click();
    const response = await retried;
    expect(response.ok(), `The retry failed with ${response.status()}: ${await response.text()}`).toBe(true);
    const run: { id: string } = await response.json();
    await this.page.waitForURL(new RegExp(`${this.url}/${run.id}(?:[?#]|$)`));
    return run.id;
  }
}

const RETRY_PATH = /^\/api\/v1\/flow-runs\/[^/]+\/retry$/;
const RUN_TIMEOUT_MS = 60_000;
