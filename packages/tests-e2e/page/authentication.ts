import { globalConfig } from "../config";
import { Page } from "@playwright/test";
import { dashboard } from "./dashboard";

export const authentication = {
    async signIn(page: Page, params: { email: string, password: string }) {
        await page.goto(`${globalConfig.instanceUrl}/sign-in`);

        const emailField = page.getByPlaceholder('Email');

        await emailField.click();
        await emailField.fill(params.email);
        await emailField.press('Tab');

        const passwordField = page.getByPlaceholder('Password');
        await passwordField.fill(params.password);
        await passwordField.press('Enter');

        await dashboard.waitFor(page);
    },
    async signUp(page: Page, params: { email: string, password: string }) {
        await page.goto(`${globalConfig.instanceUrl}/sign-up`);

        const firstNameField = page.getByText('First Name').first()
        await firstNameField.click();
        await firstNameField.fill('Bugs');
        await firstNameField.press('Tab');

        const lastNameField = page.getByText('Last Name').first()
        await lastNameField.click();
        await lastNameField.fill('Bunny');
        await lastNameField.press('Tab');

        const emailField = page.getByPlaceholder('Email');
        await emailField.click();
        await emailField.fill(params.email);
        await emailField.press('Tab');

        const passwordField = page.getByText('Password').first();
        await passwordField.fill(params.password);

        await page.locator('.cdk-overlay-backdrop').click();

        await page.getByRole('button', { name: 'Sign up' }).click();

        await dashboard.waitFor(page);
    }
}
