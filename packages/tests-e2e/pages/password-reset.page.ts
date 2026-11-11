import { BasePage } from './base';

export class PasswordResetPage extends BasePage {
  url = '/forget-password';

  async requestLink({ email }: { email: string }) {
    await this.visit();
    await this.page.getByTestId('reset-password-email').fill(email);
    const sent = this.page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/v1/otp' && response.request().method() === 'POST',
    );
    await this.page.getByTestId('reset-password-send').click();
    const response = await sent;
    if (!response.ok()) {
      throw new Error(`Requesting the reset link failed with ${response.status()}: ${await response.text()}`);
    }
  }

  async setNewPassword({ link, password }: { link: URL; password: string }) {
    await this.page.goto(`${link.pathname}${link.search}`);
    await this.page.getByTestId('reset-password-new-password').fill(password);
    await this.page.getByTestId('reset-password-confirm').click();
    await this.page.waitForURL((url) => url.pathname === '/sign-in');
  }
}
