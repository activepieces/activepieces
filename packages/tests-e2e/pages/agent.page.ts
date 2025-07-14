import { Page } from '@playwright/test';
import { BasePage } from './base';

export class AgentPage extends BasePage {
  url = `/agents`;

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