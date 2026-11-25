import { expect, Locator, Request } from '@playwright/test';
import { BasePage } from './base';

export class AlertsPage extends BasePage {
  url = '/automations';

  async open({ projectId }: { projectId: string }): Promise<void> {
    await this.page.goto(`/projects/${projectId}${this.url}`);
    await this.openAlertsTab();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.openAlertsTab();
  }

  async add(email: string): Promise<void> {
    const created = this.page.waitForResponse((response) => isAlertCreate(response.request()) && (response.request().postData() ?? '').includes(email));
    await this.submit(email);
    const response = await created;
    expect(response.ok(), `Adding the alert email failed with ${response.status()}: ${await response.text()}`).toBe(true);
  }

  async submit(email: string): Promise<void> {
    await this.page.getByTestId('alert-email-input').fill(email);
    await this.page.getByTestId('alert-email-add').click();
  }

  countAlertCreates(): () => number {
    const creates: Request[] = [];
    this.page.on('request', (request) => {
      if (isAlertCreate(request)) {
        creates.push(request);
      }
    });
    return () => creates.length;
  }

  receiver(email: string): Locator {
    return this.page.getByTestId('alert-email-receiver').filter({ hasText: email });
  }

  emailError(): Locator {
    return this.page.getByTestId('alert-email-error');
  }

  private async openAlertsTab(): Promise<void> {
    await this.page.getByTestId('project-settings-button').click();
    await this.page.getByTestId('project-settings-tab-alerts').click();
    await expect(this.page.getByTestId('alert-email-input')).toBeVisible();
  }
}

function isAlertCreate(request: Request): boolean {
  return request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/alerts';
}
