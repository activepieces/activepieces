import { expect } from '@playwright/test';
import { BasePage } from './base';

export class EmailDomainsPage extends BasePage {
  url = '/platform/sso';

  async addDomain({ domain }: { domain: string }): Promise<{ id: string; verificationRecordValue: string }> {
    await this.page.getByTestId('sso-domain-add').click();
    await this.page.getByTestId('sso-domain-input').fill(domain);
    const added = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/email-domains' && response.request().method() === 'POST',
    );
    await this.page.getByTestId('sso-domain-submit').click();
    const response = await added;
    if (!response.ok()) {
      throw new Error(`Adding ${domain} failed with ${response.status()}: ${await response.text()}`);
    }
    return response.json();
  }

  async expectTxtValue({ value }: { value: string }) {
    await expect(this.page.getByTestId('sso-domain-txt-value').getByRole('textbox')).toHaveValue(value);
  }

  async verify({ id }: { id: string }): Promise<{ verificationStatus: string }> {
    const verified = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === `/api/v1/email-domains/${id}/verify` && response.request().method() === 'POST',
    );
    await this.page.getByTestId('sso-domain-verify').click();
    const response = await verified;
    if (!response.ok()) {
      throw new Error(`Verifying domain ${id} failed with ${response.status()}: ${await response.text()}`);
    }
    return response.json();
  }

  async closeDialog() {
    await this.page.getByTestId('sso-domain-dialog-close').click();
  }

  async expectPendingRow({ domain }: { domain: string }) {
    const row = this.row({ domain });
    await expect(row).toContainText('Verifying');
    await expect(row).toContainText('Waiting for DNS');
  }

  async expectNoRow({ domain }: { domain: string }) {
    await expect(this.row({ domain })).toHaveCount(0);
  }

  async cancelVerification({ domain, id }: { domain: string; id: string }) {
    await this.row({ domain }).getByTestId('sso-domain-actions').click();
    await this.page.getByTestId('sso-domain-remove').click();
    const removed = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === `/api/v1/email-domains/${id}` && response.request().method() === 'DELETE',
    );
    await this.page.getByTestId('sso-domain-remove-confirm').click();
    const response = await removed;
    if (!response.ok()) {
      throw new Error(`Cancelling domain ${id} failed with ${response.status()}: ${await response.text()}`);
    }
  }

  private row({ domain }: { domain: string }) {
    return this.page.getByRole('group', { name: domain, exact: true });
  }
}
