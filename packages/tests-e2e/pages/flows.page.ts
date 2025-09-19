import { BasePage } from './base';
export class FlowsPage extends BasePage {
  url = `/flows`;

  async navigate() {
    await this.page.getByRole('link', { name: 'Flows' }).click();
    await this.closeTrialDialogIfPresent();
    await this.page.waitForSelector('tbody tr', { timeout: 10000 });
  }

  async waitFor() {
    await this.page.waitForSelector('tbody tr', { timeout: 10000 });
  }

  async closeTrialDialogIfPresent() {
    try {
      // Check if trial dialog is present with a short timeout
      const trialButton = this.page.getByTestId('trial-dialog-continue-button');
      await trialButton.waitFor({ timeout: 2000 });
      await trialButton.click();
      // Wait for dialog to close
      await trialButton.waitFor({ state: 'hidden', timeout: 5000 });
    } catch (error) {
      // Trial dialog is not present, continue normally
    }
  }

  async newFlowFromScratch() {
    await this.closeTrialDialogIfPresent();
    await this.page.getByTestId('new-flow-button').click();
    await this.page.getByTestId('new-flow-from-scratch-button').click();
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