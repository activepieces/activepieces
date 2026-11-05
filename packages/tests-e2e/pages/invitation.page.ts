import { expect } from '@playwright/test';
import { BasePage } from './base';

export class InvitationPage extends BasePage {
  url = `/invitation`;

  async open(link: string) {
    const { pathname, search } = new URL(link);
    await this.page.goto(`${pathname}${search}`);
  }

  async expectInvitedAs(email: string) {
    await expect(this.page.getByTestId('invitation-invited-as')).toContainText(email);
  }

  async accept() {
    await this.page.getByTestId('invitation-accept-button').click();
  }

  async expectDeadLink() {
    await expect(this.page.getByTestId('invitation-dead-link')).toHaveText('This link no longer works');
  }
}
