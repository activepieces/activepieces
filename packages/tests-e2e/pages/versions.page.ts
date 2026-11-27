import { expect, Locator } from '@playwright/test';
import { BasePage } from './base';

export class VersionsPage extends BasePage {
  url = '/flows';

  async visitFlow(flowId: string) {
    await this.page.goto(`${this.url}/${flowId}`);
    await expect(this.page.getByTestId('rf__node-trigger')).toBeVisible({ timeout: 30000 });
  }

  statusSwitch() {
    return this.page.getByTestId('flow-status-switch');
  }

  statusSwitchOfRow(rowName: Locator) {
    return this.page.getByTestId('automations-row').filter({ has: rowName }).getByTestId('flow-status-switch');
  }

  async expectTooltipOf({ element, text }: { element: Locator; text: string }) {
    await element.hover();
    await expect(this.page.getByRole('tooltip')).toHaveText(text);
  }

  async turnOff() {
    const toggle = this.statusSwitch();
    await expect(toggle).toBeChecked();
    const changed = this.waitForFlowOperation('CHANGE_STATUS');
    await toggle.click();
    const response = await changed;
    expect(response.ok(), `Turning the flow off failed with ${response.status()}: ${await response.text()}`).toBe(true);
    await expect(toggle).not.toBeChecked();
  }

  async openVersions() {
    await this.page.getByTestId('builder-flow-menu').click();
    await this.page.getByRole('menuitem', { name: 'Versions' }).click();
  }

  versionCard(versionNumber: number) {
    return this.page.getByTestId('flow-version-card').filter({ hasText: new RegExp(`Version #${versionNumber}(?!\\d)`) });
  }

  async scrollVersionsDownFrom(versionNumber: number) {
    await this.versionCard(versionNumber).hover();
    await this.page.mouse.wheel(0, 5000);
  }

  async useAsDraft(versionNumber: number) {
    await this.versionCard(versionNumber).getByTestId('flow-version-menu').click();
    await this.page.getByRole('menuitem', { name: 'Use as Draft' }).click();
    const dialog = this.page.getByRole('dialog', { name: 'Overwrite Draft' });
    const overwritten = this.waitForFlowOperation('USE_AS_DRAFT');
    await dialog.getByRole('button', { name: 'Overwrite' }).click();
    const response = await overwritten;
    expect(response.ok(), `Using version #${versionNumber} as the draft failed with ${response.status()}: ${await response.text()}`).toBe(true);
    await expect(dialog).toBeHidden();
  }

  async publishExpectingRefusal(): Promise<Locator> {
    const published = this.waitForFlowOperation('LOCK_AND_PUBLISH');
    await this.page.getByRole('button', { name: 'Publish' }).click();
    const response = await published;
    expect(response.ok(), 'The server accepted a publish that it must refuse').toBe(false);
    return this.page.getByRole('dialog', { name: 'Publish failed' });
  }

  private waitForFlowOperation(type: string) {
    return this.page.waitForResponse(
      (response) => response.request().method() === 'POST'
        && FLOW_UPDATE.test(new URL(response.url()).pathname)
        && response.request().postDataJSON()?.type === type,
    );
  }
}

const FLOW_UPDATE = /\/api\/v1\/flows\/[^/]+$/;
