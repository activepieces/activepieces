import { expect } from '@playwright/test';
import { BasePage } from './base';

export class BuilderPage extends BasePage {
  url = `/flows`;

  async nameNewFlow(name: string) {
    const breadcrumb = this.page.getByRole('navigation', { name: 'breadcrumb' });
    await breadcrumb.getByText('Untitled', { exact: true }).click();
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.insertText(name);
    await this.page.keyboard.press('Enter');
    await expect(breadcrumb.getByText(name, { exact: true })).toBeVisible();
  }

  async selectTrigger({ piece, trigger }: { piece: string; trigger: string }) {
    await this.page.getByTestId('rf__node-trigger').click();
    await this.page.getByTestId('pieces-search-input').fill(piece);
    await this.page.getByTestId(`action-or-trigger-${trigger}`).click();
  }

  async addStep({ after, piece, action }: { after: string; piece: string; action: string }) {
    await this.page.locator(`[data-testid="add-action-button"][data-parent-step="${after}"]`).click();
    await this.page.getByTestId('pieces-search-input').fill(piece);
    await this.page.getByTestId(`action-or-trigger-${action}`).click();
  }

  async webhookUrl(): Promise<string> {
    const url = await this.sidebar().getByTestId('markdown-code-block').first().textContent();
    if (!url?.trim()) {
      throw new Error('The webhook trigger shows no URL');
    }
    return url.trim();
  }

  async testWebhookTrigger({ webhookUrl, value }: { webhookUrl: string; value: number }) {
    await this.page.getByTestId('test-trigger-button').click();
    await this.page.getByRole('button', { name: 'Generate Sample Data' }).waitFor();
    const sample = this.sidebar().getByRole('button', { name: `queryParams value: ${value}` });
    await expect(async () => {
      await this.page.request.get(`${webhookUrl}/test?value=${value}`);
      await expect(sample).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 60000 });
  }

  async setCodeInput({ key, value }: { key: string; value: string }) {
    await this.sidebar().getByRole('button', { name: 'Add Item' }).click();
    const fields = this.sidebar().getByRole('textbox');
    await fields.nth(0).fill(key);
    await fields.nth(1).click();
    await this.page.keyboard.insertText(value);
    await this.waitForSaveOfLastEdit();
  }

  async setCode(code: string) {
    await this.replaceEditorText({ testId: 'code-editor', text: code });
  }

  async setJsonBody(json: string) {
    await this.replaceEditorText({ testId: 'json-editor', text: json });
  }

  async testStep() {
    await this.sidebar().getByTestId('test-step-button').click();
    const succeeded = this.sidebar().getByText('Tested Successfully');
    await succeeded.or(this.sidebar().getByText('Test Failed')).first().waitFor({ timeout: 60000 });
    await expect(succeeded, 'The step test failed').toBeVisible();
  }

  async expectStepOutput({ key, value }: { key: string; value: string }) {
    await expect(this.sidebar().getByRole('tabpanel', { name: 'Friendly View' })).toContainText(
      new RegExp(`${key}\\s*${value}`),
    );
  }

  async testFlow() {
    await this.page.getByRole('button', { name: /^Test Flow/ }).click();
    const succeeded = this.page.getByText('Run Succeeded');
    await succeeded.or(this.page.getByText('Run Failed')).first().waitFor({ timeout: 60000 });
    await expect(succeeded, 'The test run failed').toBeVisible();
    await this.page.getByRole('button', { name: 'Edit flow', exact: true }).click();
  }

  async publish() {
    const publishButton = this.page.getByRole('button', { name: 'Publish' });
    await publishButton.click();
    await expect(publishButton).toBeHidden({ timeout: 60000 });
  }

  async expectSyncWebhookResponse({ url, expected }: { url: string; expected: Record<string, unknown> }) {
    await expect
      .poll(
        async () => {
          const response = await this.page.request.get(url);
          return { status: response.status(), body: await response.json().catch(() => undefined) };
        },
        { timeout: 60000, intervals: [2000, 3000, 5000] },
      )
      .toEqual({ status: 200, body: expected });
  }

  private sidebar() {
    return this.page.getByTestId('right-sidebar');
  }

  private async replaceEditorText({ testId, text }: { testId: string; text: string }) {
    await this.sidebar().getByTestId(testId).getByRole('textbox').click();
    await this.page.keyboard.press('ControlOrMeta+a');
    await this.page.keyboard.insertText(text);
    await this.waitForSaveOfLastEdit();
  }

  private async waitForSaveOfLastEdit() {
    const save = await this.page.waitForRequest(
      (request) => request.method() === 'POST' && FLOW_SAVE.test(new URL(request.url()).pathname),
    );
    await save.response();
  }
}

const FLOW_SAVE = /\/api\/v1\/flows\/[^/]+$/;
