import { Page, Locator } from '@playwright/test';
import { BasePage } from './base';

export class FlowsPage extends BasePage {
  url = '/flows';

  getters = {
    startBuildingButton: (page: Page) => page.getByText('Start building your first flow'),
    newFlowButton: (page: Page) => page.getByRole('button', { name: 'New Flow' }),
    fromScratchButton: (page: Page) => page.getByText('From Scratch'),
    flowRow: (page: Page, flowName: string) => page.getByRole('row', { name: new RegExp(`^${flowName}`) }),
    flowActionsButton: (page: Page, flowName: string) => this.getters.flowRow(page, flowName).getByRole('button').first(),
    deleteMenuItem: (page: Page) => page.getByRole('menuitem', { name: 'Delete' }),
    confirmDeleteInput: (page: Page) => page.getByPlaceholder('DELETE'),
    confirmButton: (page: Page) => page.getByRole('button', { name: 'Confirm' }),
  };

  actions = {
    deleteFlow: async (page: Page, params: { flowName: string }) => {
      await this.getters.flowActionsButton(page, params.flowName).click();
      await this.getters.deleteMenuItem(page).click();
      await this.getters.confirmDeleteInput(page).fill('DELETE');
      await this.getters.confirmButton(page).click();
      await page.waitForSelector('button:has-text("Confirm")', { state: 'hidden' });
    },

    newFlowFromScratch: async (page: Page) => {
      const startBuildingButton = this.getters.startBuildingButton(page);
      const isVisible = await startBuildingButton.isVisible();
      
      if (isVisible) {
        await startBuildingButton.click();
        await this.getters.fromScratchButton(page).click();
      } else {
        await this.getters.newFlowButton(page).click();
        await this.getters.fromScratchButton(page).click();
      }
    },
  };
} 