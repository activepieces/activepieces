import { BasePage } from './base';
import { faker } from '@faker-js/faker';

export class AuthenticationPage extends BasePage {
  url = `/sign-in`;
  signUpUrl = `/sign-up`;

  async signIn(params: { email: string; password: string }) {
    await this.page.goto(this.url);
    await this.openPasswordForm();
    await this.switchToSignInForm();

    const emailField = this.page.getByTestId('sign-in-email');
    await emailField.click();
    await emailField.fill(params.email);

    const passwordField = this.page.getByTestId('sign-in-password');
    await passwordField.click();
    await passwordField.fill(params.password);

    await this.page.getByTestId('sign-in-button').click();
  }

  async signUp(params?: { email?: string; password?: string; firstName?: string; lastName?: string }) {
    await this.page.goto(this.signUpUrl);
    await this.openPasswordForm();
    await this.switchToSignUpForm();

    const firstNameField = this.page.getByTestId('sign-up-first-name');
    await firstNameField.click();
    await firstNameField.fill(params?.firstName || 'Bugs');
    await firstNameField.press('Tab');

    const lastNameField = this.page.getByTestId('sign-up-last-name');
    await lastNameField.click();
    await lastNameField.fill(params?.lastName || 'Bunny');
    await lastNameField.press('Tab');

    const emailField = this.page.getByTestId('sign-up-email');
    await emailField.click();
    await emailField.fill(params?.email || faker.internet.email());
    await emailField.press('Tab');

    const passwordField = this.page.getByTestId('sign-up-password');
    await passwordField.click();
    await passwordField.fill(params?.password || faker.internet.password({
      pattern: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?a-zA-Z0-9]/,
      length: 12,
      prefix: '0'
    }));

    await this.page.getByTestId('sign-up-button').click();

    await this.completeOnboardingName(
      `${params?.firstName || 'Bugs'} ${params?.lastName || 'Bunny'}`,
    );
  }

  private async completeOnboardingName(fullName: string) {
    const nameField = this.page.getByTestId('auth-full-name');

    const nameStepShown = nameField
      .waitFor({ timeout: 30000 })
      .catch(() => undefined);
    const leftOnboarding = this.page
      .waitForURL(
        (url) =>
          !ONBOARDING_PATHS.some((path) => url.pathname.startsWith(path)),
        { timeout: 30000 },
      )
      .catch(() => undefined);
    await Promise.race([nameStepShown, leftOnboarding]);

    if (!(await nameField.count())) {
      return;
    }

    await nameField.fill(fullName);
    await this.page.getByTestId('auth-name-continue').click();
  }

  private passwordFormField() {
    return this.page
      .getByTestId('sign-in-email')
      .or(this.page.getByTestId('sign-up-email'));
  }

  private async openPasswordForm() {
    const usePasswordLink = this.page
      .getByTestId('auth-use-password')
      .or(this.page.getByRole('button', { name: 'Use password' }));
    await this.passwordFormField()
      .or(usePasswordLink)
      .first()
      .waitFor({ timeout: 30000 });

    if (await usePasswordLink.count()) {
      await usePasswordLink.first().click();
      await this.passwordFormField().first().waitFor();
    }
  }

  private async switchToSignInForm() {
    const signInEmail = this.page.getByTestId('sign-in-email');
    if (await signInEmail.count()) {
      return;
    }

    const switchMode = this.page.getByTestId('auth-switch-mode');
    if (!(await switchMode.count())) {
      throw new Error(
        'The auth card offers no password sign-in: this instance has no account yet, so it only allows creating the first one.',
      );
    }

    await switchMode.click();
    await signInEmail.waitFor();
  }

  private async switchToSignUpForm() {
    const signUpEmail = this.page.getByTestId('sign-up-email');
    if (await signUpEmail.count()) {
      return;
    }

    const switchMode = this.page.getByTestId('auth-switch-mode');
    if (!(await switchMode.count())) {
      throw new Error(
        'Password sign-up is unreachable on this instance: the auth card offers only the email-code flow. Set E2E_EMAIL and E2E_PASSWORD to sign in with an existing account instead.',
      );
    }

    await switchMode.click();
    await signUpEmail.waitFor();
  }
}

const ONBOARDING_PATHS = ['/sign-in', '/sign-up', '/create-platform'];
