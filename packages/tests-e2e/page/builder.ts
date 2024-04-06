import { Page, expect } from '@playwright/test';

const property = {
    async selectConnection(page: Page, params: { connection: string }) {
        await page.getByRole('combobox', { name: 'Connection' }).locator('span').click();
        await page.getByText(params.connection, { exact: true }).click();
    },
    async selectDropdown(page: Page, params: { property: string, value: string }) {
        await page.getByText(params.property, { exact: true }).click()
        await page.getByText(params.value).click();
    }
}

export const builder = {
    async selectInitialTrigger(page: Page, params: { piece: string, trigger: string }) {
        await page.getByText('Select Trigger', { exact: true }).click();
        await page.getByPlaceholder('Search').click();
        await page.getByPlaceholder('Search').fill(params.piece);
        await page.getByAltText(params.piece).click();

        await page.locator('mat-form-field div').filter({ hasText: 'Trigger Select a Trigger' }).first().click();
        await page.getByText(params.trigger, { exact: true }).click();
        await page.waitForTimeout(5000);
    },
    async addAction(page: Page, params: { piece: string, action: string }) {
        await page.locator('app-small-add-button div').first().click();
        await page.getByPlaceholder('Search').click();
        await page.getByPlaceholder('Search').fill(params.piece);
        await page.getByText(params.piece).click();

        await page.getByText('Select an Action', { exact: true }).click();
        await page.getByText(params.action, { exact: true }).click();
    },
    async testFlowAndWaitForSuccess(page: Page) {
        await page.getByText('Test flow').click();
        await page.waitForSelector('//*[contains(text(),"Run succeeded")]'); // Wait for the element to appear
        const runSuccessText = await page.locator('//*[contains(text(),"Run succeeded")]').textContent();
        expect(runSuccessText).toContain('Run succeeded');
    },
    async exitRun(page: Page) {
        await page.getByRole('button', { name: 'Exit Run' }).click();
    },
    async clickHome(page: Page) {
        await page.getByLabel('Home').click();
    },
    property,
}

