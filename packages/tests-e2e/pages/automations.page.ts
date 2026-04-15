import { BasePage } from './base';

export class AutomationsPage extends BasePage {
  url = `/automations`;

  async navigate() {
    await this.page.getByRole('link', { name: 'Automations' }).click();
    await this.waitFor();
  }

  async waitFor() {
    await this.page.waitForURL('**/automations**');
    await Promise.race([
      this.page.waitForSelector('text="Get started with Activepieces"'),
      this.page.waitForSelector('button:has-text("Create New")'),
    ]);
  }

  async newFlowFromScratch() {
    const createNewButton = this.page.getByRole('button', { name: 'Create New' });
    if (await createNewButton.isVisible()) {
      await createNewButton.click();
      await this.page.getByRole('menuitem', { name: 'New Flow' }).click();
    } else {
      // Empty state - click "Start from scratch" in the "Build a Flow" card
      await this.page.getByRole('button', { name: 'Start from scratch' }).first().click();
    }
  }

  async cleanupExistingAutomations() {
    while (true) {
      const moreButtons = this.page.locator('button:has(svg.lucide-more-horizontal)');
      if (!(await moreButtons.count())) break;

      await moreButtons.first().click();
      await this.page.getByRole('menuitem', { name: 'Delete' }).click();

      const confirmButton = this.page.getByRole('button', { name: 'Remove' });
      await confirmButton.click();
      await this.page.waitForSelector('button:has-text("Remove")', { state: 'hidden' });
      await this.page.reload();
      await this.waitFor();
    }
  }
}
