import { expect } from '@playwright/test';
import { BasePage } from './base';

export class PlatformSwitcherPage extends BasePage {
  url = `/`;

  async open() {
    await this.visit();
    await this.page.getByTestId('platform-switcher-trigger').click();
    await this.page.getByTestId('platform-switcher-menu').waitFor();
  }

  async expectCreatePlatformHidden() {
    await expect(this.page.getByTestId('platform-switcher-item')).not.toHaveCount(0);
    await expect(this.page.getByTestId('platform-switcher-create')).toHaveCount(0);
  }
}
