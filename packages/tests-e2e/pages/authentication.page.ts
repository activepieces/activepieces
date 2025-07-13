import { Page, Locator } from '@playwright/test';
import { BasePage } from './base';
import { globalConfig } from '../config';

export class AuthenticationPage extends BasePage {
  url = `${globalConfig.instanceUrl}/sign-in`;
  signUpUrl = `${globalConfig.instanceUrl}/sign-up`;

  getters = {
    emailField: (page: Page) => page.getByPlaceholder('Email'),
    passwordField: (page: Page) => page.getByPlaceholder('********'),
    firstNameField: (page: Page) => page.getByText('First Name').first(),
    lastNameField: (page: Page) => page.getByText('Last Name').first(),
    signUpButton: (page: Page) => page.getByRole('button', { name: 'Sign up' }),
    signInButton: (page: Page) => page.getByRole('button', { name: 'Sign in' }),
  };

  actions = {
    signIn: async (page: Page, params: { email: string; password: string }) => {
      await page.goto(this.url);
      
      const emailField = this.getters.emailField(page);
      await emailField.click();
      await emailField.fill(params.email);
      await emailField.press('Tab');

      const passwordField = this.getters.passwordField(page);
      await passwordField.fill(params.password);
      await passwordField.press('Enter');
    },

    signUp: async (page: Page, params: { email: string; password: string }) => {
      await page.goto(this.signUpUrl);

      const firstNameField = this.getters.firstNameField(page);
      await firstNameField.click();
      await firstNameField.fill('Bugs');
      await firstNameField.press('Tab');

      const lastNameField = this.getters.lastNameField(page);
      await lastNameField.click();
      await lastNameField.fill('Bunny');
      await lastNameField.press('Tab');

      const emailField = this.getters.emailField(page);
      await emailField.click();
      await emailField.fill(params.email);
      await emailField.press('Tab');

      const passwordField = this.getters.passwordField(page);
      await passwordField.fill(params.password);

      await this.getters.signUpButton(page).click();
    },
  };
} 