import { Page } from "@playwright/test";

export const flows = {
    deleteFlow: async (page: Page, params: { flowName: string }) => {
        await page.getByRole('row', { name: new RegExp(`^${params.flowName}`) }).getByRole('button').first().click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();

        await page.getByPlaceholder('DELETE').fill('DELETE');
        const confirmButton = await page.getByRole('button', { name: 'Confirm' });
        await confirmButton.click()

        await page.waitForSelector('button:has-text("Confirm")', { state: 'hidden' });
    },
    newFlowFromScratch: async (page: Page) => {
        const startBuildingButton = await page.getByText('Start building your first flow');
        if (startBuildingButton) {
            await startBuildingButton.click();
            await page.getByText('Start from scratch').click();
        } else {
            const newFlowButton = await page.getByRole('button', { name: 'New Flow' });
            await newFlowButton.click();
            await page.getByText('From Scratch').click();
        }
    },
}
