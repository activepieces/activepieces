import { Page } from '@playwright/test';
import { BasePage } from './base';
import { configUtils } from '../helper/config';

export class AuthenticationPage extends BasePage {
  url = `${configUtils.getConfig().instanceUrl}/sign-in`;
  signUpUrl = `${configUtils.getConfig().instanceUrl}/sign-up`;

  getters = {
    emailField: (page: Page) => page.getByPlaceholder('email@example.com'),
    passwordField: (page: Page) => page.getByPlaceholder('********'),
    firstNameField: (page: Page) => page.getByText('First Name').first(),
    lastNameField: (page: Page) => page.getByText('Last Name').first(),
    signUpButton: (page: Page) => page.getByRole('button', { name: 'Sign up' }),
    signInButton: (page: Page) => page.getByRole('button', { name: 'Sign in', exact: true }),
  };

  actions = {
    signIn: async (page: Page, params: { email: string; password: string }) => {
      await page.goto(this.url);
      
      const emailField = this.getters.emailField(page);
      await emailField.click();
      await emailField.fill(params.email);
      
      const passwordField = this.getters.passwordField(page);
      await passwordField.click();
      await passwordField.fill(params.password);
      
      await this.getters.signInButton(page).click();
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
      await passwordField.click();
      await passwordField.fill(params.password);

      await this.getters.signUpButton(page).click();
    },
  };
} 