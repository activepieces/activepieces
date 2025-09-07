import { Page } from '@playwright/test';
import { BasePage } from './base';
import { configUtils } from '../helper/config';

export class FlowsPage extends BasePage {
  url = `${configUtils.getConfig().instanceUrl}/flows`;

  getters = {
    createFlowButton: (page: Page) => page.getByRole('button', { name: 'Create Flow' }),
    fromScratchButton: (page: Page) => page.getByText('From scratch'),
    flowRow: (page: Page, flowName: string) => page.getByRole('row', { name: new RegExp(`^${flowName}`) }),
    flowActionsButton: (page: Page, flowName: string) => this.getters.flowRow(page, flowName).getByRole('button').first(),
    deleteMenuItem: (page: Page) => page.getByRole('menuitem', { name: 'Delete' }),
    confirmDeleteInput: (page: Page) => page.getByPlaceholder('DELETE'),
    confirmButton: (page: Page) => page.getByRole('button', { name: 'Confirm' }),
    sidebarFlowsLink: (page: Page) => page.getByRole('link', { name: 'Flows' }),
    mutedForegroundSpans: (page: Page) => page.locator('span.text-muted-foreground'),
    deleteButton: (page: Page) => page.locator('td:nth-child(7)').first(),
    removeButton: (page: Page) => page.getByRole('button', { name: 'Remove' }),
    pageTitle: (page: Page) => page.locator('h1:has-text("Flows")'),  
  };

  actions = {
    waitFor: async (page: Page) => {
      await page.waitForURL('**/flows');
      await this.getters.pageTitle(page).waitFor({ state: 'visible' });
    },
    navigate: async (page: Page) => {
      await this.getters.sidebarFlowsLink(page).click();
      await page.waitForTimeout(2000);
      await page.waitForSelector('tbody tr', { timeout: 10000 });
    },

    newFlowFromScratch: async (page: Page) => {
      await page.waitForSelector('button:has-text("Create Flow")');
      await this.getters.createFlowButton(page).click();
      await this.getters.fromScratchButton(page).click();
    },

    cleanupExistingFlows: async (page: Page) => {
      while ((await this.getters.mutedForegroundSpans(page).count()) > 1) {
        if (!(await this.getters.deleteButton(page).count())) break;
        await this.getters.deleteButton(page).click();
        await this.getters.deleteMenuItem(page).click();
        const confirmButton = await this.getters.removeButton(page);
        await confirmButton.click();
        await page.waitForSelector('button:has-text("Remove")', { state: 'hidden' });
        await page.reload();
      }
    },
  };
} 