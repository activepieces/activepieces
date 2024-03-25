import { Page } from "@playwright/test";


export const dashboard = { 
    waitFor: async (page: Page) => {
        await page.getByLabel("Home").waitFor({
            timeout: 5000
        });
    }
}