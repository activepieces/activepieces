import { BasePage } from './base';
import { faker } from '@faker-js/faker';

export class AuthenticationPage extends BasePage {
  url = `/sign-in`;
  signUpUrl = `/sign-up`;

  async signIn(params: { email: string; password: string }) {
    await this.page.goto(this.url);
    
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
  }
} 