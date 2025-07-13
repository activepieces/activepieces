import { Page, Locator } from '@playwright/test';
import { BasePage } from './base';

export class DashboardPage extends BasePage {
  url = '/dashboard';

  getters = {
    dashboardContainer: (page: Page) => page.locator('[data-testid="dashboard"]'),
    welcomeMessage: (page: Page) => page.getByText('Welcome'),
  };

  actions = {
    waitFor: async (page: Page) => {
      await page.waitForURL('**/projects/**');
      await this.getters.dashboardContainer(page).waitFor({ state: 'visible' });
    },
  };
} 