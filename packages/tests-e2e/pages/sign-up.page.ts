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
    const attempt = await this.attemptSignUp({ person });
    if (!attempt.userId) {
      throw new Error(`Sign-up failed with ${attempt.status}: ${attempt.error}`);
    }
    return { userId: attempt.userId };
  }

  async attemptSignUp({ person, onCreated }: { person: Person; onCreated?: (userId: string) => void }): Promise<SignUpAttempt> {
    const response = this.page.waitForResponse((candidate) => candidate.url().endsWith(SIGN_UP_PATH));
    await this.submit(person);
    const answered = await response;
    if (!answered.ok()) {
      return { status: answered.status(), error: await answered.text() };
    }
    const user: { id: string } = await answered.json();
    onCreated?.(user.id);
    return { status: answered.status(), userId: user.id };
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

type SignUpAttempt = { status: number; userId?: string; error?: string };
