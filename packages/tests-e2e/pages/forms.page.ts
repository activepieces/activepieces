import { readFile } from 'node:fs/promises';
import { expect, Request } from '@playwright/test';
import { BasePage } from './base';

export class FormsPage extends BasePage {
  url = '/forms';

  async visitForm(flowId: string) {
    await this.page.goto(`${this.url}/${flowId}`);
  }

  async fillField({ key, value }: { key: string; value: string }) {
    await this.field(key).fill(value);
  }

  async attachFile({ key, name, content }: { key: string; name: string; content: string }) {
    await this.field(key).setInputFiles({ name, mimeType: 'text/plain', buffer: Buffer.from(content) });
  }

  async submit() {
    const submitted = this.page.waitForResponse((response) => isSubmission(response.request()));
    await this.page.getByTestId('form-submit').click();
    const response = await submitted;
    expect(response.ok(), `The form submission failed with ${response.status()}`).toBe(true);
  }

  async clickSubmit() {
    await this.page.getByTestId('form-submit').click();
  }

  countSubmissions(): () => number {
    const submissions: Request[] = [];
    this.page.on('request', (request) => {
      if (isSubmission(request)) {
        submissions.push(request);
      }
    });
    return () => submissions.length;
  }

  async expectFlowResponse(text: string) {
    await expect(this.page.getByTestId('form-response')).toHaveText(text, { timeout: 60000 });
  }

  async expectFieldError({ key, message }: { key: string; message: string }) {
    await expect(this.field(key)).toHaveAttribute('aria-invalid', 'true');
    await expect(this.field(key)).toHaveAccessibleDescription(message);
  }

  async downloadFileOfOpenStep(): Promise<{ name: string; content: string }> {
    const downloaded = this.page.waitForEvent('download');
    await this.page.getByTestId('right-sidebar').getByTestId('step-file-download').click();
    const download = await downloaded;
    return { name: download.suggestedFilename(), content: await readFile(await download.path(), 'utf8') };
  }

  async expectNotFound(title: string) {
    await expect(this.page.getByTestId('not-found-title')).toHaveText(title);
  }

  private field(key: string) {
    return this.page.getByTestId(`form-field-${key}`);
  }
}

function isSubmission(request: Request) {
  return request.method() === 'POST' && /\/api\/v1\/webhooks\/[^/]+(\/sync)?$/.test(new URL(request.url()).pathname);
}
