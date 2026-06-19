import { expect } from '@playwright/test';
import { BasePage } from './base';

export class BuilderPage extends BasePage {
  url = `/builder`;

  async selectInitialTrigger(params: { piece: string; trigger: string }) {
    await this.page.getByTestId('rf__node-trigger').filter({ hasText: 'Select Trigger' }).click();
    await this.page.getByTestId('pieces-search-input').fill(params.trigger);
    await this.page.getByText(params.trigger).click();
  }

  async addAction(params: { piece: string; action: string }) {
    await this.page.getByTestId('add-action-button').click();
    await this.page.getByTestId('pieces-search-input').fill(params.piece);    
    await this.page.getByTestId(params.piece).click();
    await this.page.getByText(params.action).nth(1).click();
  }

  async testFlowAndWaitForSuccess() {
    await this.page.getByRole('button', { name: 'Test Flow' }).click();
    await this.page.waitForTimeout(1000);
    const runSuccessLocator = this.page.locator('text=Run Succeeded');
    const runSuccessText = await runSuccessLocator.textContent({ timeout: 60000 });
    expect(runSuccessText).toContain('Run Succeeded');
  }

  async testStep() {
    await this.page.getByRole('button', { name: 'Test Step Ctrl + G' }).click();
    await this.page.waitForTimeout(8000);
  }

  async testTrigger() {
    await this.page.getByTestId('test-trigger-button').click();
    await this.page.waitForTimeout(5000);
  }

  async handleDismissButton() {
    const dismissButton = this.page.getByRole('button', { name: 'Dismiss' });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }
  }

  async loadSampleData() {
    await this.page.getByText('Load Sample data').click();
    await this.page.waitForTimeout(8000);
  }

  async publishFlow() {
    await this.page.getByRole('button', { name: 'Publish' }).click();
    await this.page.waitForTimeout(15000);
  }

  async waitFor() {
    await this.page.waitForURL('**/flows/**');
    await this.page.waitForSelector('.react-flow__nodes', { state: 'visible' });
    await this.page.waitForSelector('.react-flow__node', { state: 'visible' });
  }

  // A freshly published version may not serve synchronous requests immediately
  // (the sync URL can briefly 404), so poll until the Return Response reflects
  // the published flow.
  async expectSyncWebhookResponse(params: { url: string; key: string; expected: string }) {
    await expect
      .poll(
        async () => {
          const response = await this.page.context().request.get(params.url);
          const body: Record<string, unknown> = await response
            .json()
            .catch(() => ({}));
          return body[params.key];
        },
        { timeout: 60000, intervals: [2000, 3000, 5000] },
      )
      .toBe(params.expected);
  }
}
