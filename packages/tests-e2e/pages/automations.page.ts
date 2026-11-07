import { BasePage } from './base';

export class AutomationsPage extends BasePage {
  url = `/automations`;

  async createFlow(): Promise<string> {
    await this.visit();
    const startFromScratch = this.page.getByRole('button', { name: 'Start from scratch' }).first();
    const createNew = this.page.getByRole('button', { name: 'Create New' });
    await startFromScratch.or(createNew).first().waitFor();
    await this.page.getByTestId('automations-loading').waitFor({ state: 'detached' });

    if (await startFromScratch.isVisible()) {
      await startFromScratch.click();
    } else {
      await createNew.click();
      await this.page.getByRole('menuitem', { name: 'New Flow' }).click();
    }

    await this.page.waitForURL(FLOW_URL);
    const flowId = FLOW_URL.exec(this.page.url())?.[1];
    if (!flowId) {
      throw new Error(`No flow id in ${this.page.url()}`);
    }
    return flowId;
  }
}

const FLOW_URL = /\/flows\/([^/?#]+)/;
