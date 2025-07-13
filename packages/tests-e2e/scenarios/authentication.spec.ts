import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { globalConfig } from '../config';
import { AuthenticationPage, DashboardPage } from '../pages';

test.describe('Authentication Scenarios', () => {
  let authenticationPage: AuthenticationPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async () => {
    authenticationPage = new AuthenticationPage();
    dashboardPage = new DashboardPage();
  });

  test('should sign up new user successfully', async ({ page }) => {
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.getters.welcomeMessage(page)).toBeVisible();
  });

  test('should sign in existing user successfully', async ({ page }) => {
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    
    await page.getByRole('button', { name: 'Sign out' }).click();
    
    await authenticationPage.actions.signIn(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto(authenticationPage.url);
    
    await authenticationPage.getters.emailField(page).fill('invalid@email.com');
    await authenticationPage.getters.passwordField(page).fill('wrongpassword');
    await authenticationPage.getters.passwordField(page).press('Enter');
    
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto(authenticationPage.url);
    
    await authenticationPage.getters.passwordField(page).press('Enter');
    
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
}); 