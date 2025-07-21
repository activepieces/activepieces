import { Page } from '@playwright/test';
import { BasePage } from './base';
import { configUtils } from '../helper/config';

export class AgentPage extends BasePage {
  url = `${configUtils.getConfig().instanceUrl}/agents`;

  getters = {
    pageTitle: (page: Page) => page.locator('h1:has-text("Agents")'),
  };

  actions = {
    waitFor: async (page: Page) => {
      await page.waitForURL('**/agents');
      await this.getters.pageTitle(page).waitFor({ state: 'visible' });
    },
  };
} 