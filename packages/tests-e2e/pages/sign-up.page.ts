import { expect } from '@playwright/test';
import { BasePage } from './base';

export class SignUpPage extends BasePage {
  url = `/sign-in`;

  async openAs(email: string) {
    await this.page.goto(`${this.url}?${new URLSearchParams({ email })}`);
  }

  async expectEmail(email: string) {
    await expect(this.page.getByTestId('sign-up-email')).toHaveValue(email);
  }

  async signUp(person: Person): Promise<{ userId: string }> {
    const response = this.page.waitForResponse((candidate) => candidate.url().endsWith(SIGN_UP_PATH));
    await this.submit(person);
    const signedUp = await response;
    if (!signedUp.ok()) {
      throw new Error(`Sign-up failed with ${signedUp.status()}: ${await signedUp.text()}`);
    }
    const user: { id: string } = await signedUp.json();
    return { userId: user.id };
  }

  async submit(person: Person) {
    await this.page.getByTestId('sign-up-first-name').fill(person.firstName);
    await this.page.getByTestId('sign-up-last-name').fill(person.lastName);
    await this.page.getByTestId('sign-up-password').fill(person.password);
    await this.page.getByTestId('sign-up-button').click();
  }

  async expectSignedInAs(email: string) {
    await expect(this.page.getByRole('button', { name: email })).toBeVisible();
  }

  async expectRestricted() {
    await expect(this.page.getByTestId('sign-up-server-error')).toHaveText(
      'Sign up is restricted. You need an invitation to join. Please contact the administrator.',
    );
  }
}

const SIGN_UP_PATH = '/api/v1/authentication/sign-up';

type Person = { firstName: string; lastName: string; password: string };
