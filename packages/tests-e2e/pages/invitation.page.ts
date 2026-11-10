import { expect } from '@playwright/test';
import { BasePage } from './base';

export class InvitationPage extends BasePage {
  url = `/invitation`;

  async open(link: URL) {
    await this.page.goto(`${link.pathname}${link.search}`);
  }

  async expectInvitedAs(email: string) {
    await expect(this.page.getByTestId('invitation-invited-as')).toContainText(email);
  }

  async accept() {
    await this.page.getByTestId('invitation-accept-button').click();
  }

  async expectDeadLink() {
    await expect(this.page.getByTestId('invitation-dead-link')).toHaveText('This invitation is no longer valid');
    await expect(this.page.getByTestId('invitation-dead-link-sign-in')).toBeVisible();
  }
}
