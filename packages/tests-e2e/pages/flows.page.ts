import { BasePage } from './base';
export class FlowsPage extends BasePage {
  url = `/flows`;

  async navigate() {
    await this.page.getByRole('link', { name: 'Flows' }).click();
    await this.page.waitForSelector('tbody tr');
  }

  async waitFor() {
    await this.page.waitForSelector('tbody tr');
  }

  async newFlowFromScratch() {
    await this.page.getByTestId('new-flow-button').click();
  }

  async cleanupExistingFlows() {
    while ((await this.page.locator('span.text-muted-foreground').count()) > 1) {
      if (!(await this.page.locator('td:nth-child(7)').first().count())) break;
      await this.page.locator('td:nth-child(7)').first().click();
      await this.page.getByRole('menuitem', { name: 'Delete' }).click();
      const confirmButton = this.page.getByRole('button', { name: 'Remove' });
      await confirmButton.click();
      await this.page.waitForSelector('button:has-text("Remove")', { state: 'hidden' });
      await this.page.reload();
    }
  }
} 