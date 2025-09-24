import { Page, expect } from '@playwright/test';
import { BasePage } from './base';
import { configUtils } from '../helper/config';

export class BuilderPage extends BasePage {
  url = `${configUtils.getConfig().instanceUrl}/builder`;

  getters = {
    searchPlaceholder: (page: Page) => page.getByRole('textbox', { name: 'Search' }),
    triggerNode: (page: Page) => page.locator('div[data-testid="rf__node-trigger"]').filter({ hasText: 'Select Trigger' }),
    addButton: (page: Page) => page.locator('div.bg-light-blue'),
    testFlowButton: (page: Page) => page.getByRole('button', { name: 'Test Flow' }),
    testStepButton: (page: Page) => page.getByRole('button', { name: 'Test Step Ctrl + G' }),
    testTriggerButton: (page: Page) => page.getByRole('button', { name: 'Test Trigger Ctrl + G' }),
    runSucceededText: (page: Page) => page.locator('text=Run Succeeded'),
    exitRunButton: (page: Page) => page.getByTestId('exit-run-button'),
    dismissButton: (page: Page) => page.getByRole('button', { name: 'Dismiss' }),
    loadSampleDataButton: (page: Page) => page.getByText('Load Sample data'),
    connectionSelectButton: (page: Page) => page.locator('button').filter({ hasText: 'Select a connection' }),
    channelSelectButton: (page: Page) => page.locator('button').filter({ hasText: 'Select channel' }),
    messageInput: (page: Page) => page.locator('div').filter({ hasText: /^Message \*The text of your message$/ }).locator('div').nth(3),
    webhookInput: (page: Page) => page.locator('input.grow.bg-background'),
    publishButton: (page: Page) => page.getByRole('button', { name: 'Publish' }),
    codeEditor: (page: Page) => page.locator('div.cm-activeLine.cm-line'),
  };

  actions = {
    selectInitialTrigger: async (page: Page, params: { piece: string; trigger: string }) => {
      await this.getters.triggerNode(page).click();
      await this.getters.searchPlaceholder(page).fill(params.trigger);
      await page.getByText(params.trigger).click();
      await page.waitForTimeout(2000);
    },

    addAction: async (page: Page, params: { piece: string; action: string }) => {
      await this.getters.addButton(page).click();
      await this.getters.searchPlaceholder(page).fill(params.piece);
      await page.getByText(params.piece, { exact: true }).click();
      await page.getByText(params.action).click();
    },

    testFlowAndWaitForSuccess: async (page: Page) => {
      await this.getters.testFlowButton(page).click();
      await page.waitForTimeout(1000);
      const runSuccessLocator = this.getters.runSucceededText(page);
      const runSuccessText = await runSuccessLocator.textContent({ timeout: 60000 });
      expect(runSuccessText).toContain('Run Succeeded');
    },

    testStep: async (page: Page) => {
      await this.getters.testStepButton(page).click();
      await page.waitForTimeout(8000);
    },

    testTrigger: async (page: Page) => {
      await this.getters.testTriggerButton(page).click();
      await page.waitForTimeout(5000);
    },

    exitRun: async (page: Page) => {
      await this.getters.exitRunButton(page).click();
    },

    handleDismissButton: async (page: Page) => {
      if (await this.getters.dismissButton(page).isVisible()) {
        await this.getters.dismissButton(page).click();
      }
    },

    loadSampleData: async (page: Page) => {
      await this.getters.loadSampleDataButton(page).click();
      await page.waitForTimeout(8000);
    },

    selectSlackConnection: async (page: Page) => {
      await this.getters.connectionSelectButton(page).click();
      await page.getByLabel('slack').click();
      await page.waitForTimeout(2000);
    },

    selectSlackChannel: async (page: Page, channel: string) => {
      await this.getters.channelSelectButton(page).click();
      await page.waitForFunction(() => {
        const channelElement = document.querySelector('body');
        if (channelElement?.textContent && channelElement.textContent.includes('Channel')) {
          return channelElement;
        }
      }, { timeout: 10000 });
      await page.getByText(channel).click();
    },

    fillSlackMessage: async (page: Page, message: string) => {
      await this.getters.messageInput(page).click();
      await this.getters.messageInput(page).fill(message);
    },

    publishFlow: async (page: Page) => {
      await this.getters.publishButton(page).click();
      await page.waitForTimeout(25000);
    },

    fillCodeEditor: async (page: Page, code: string) => {
      await this.getters.codeEditor(page).fill(code);
    },

    waitFor: async (page: Page) => {
      await page.waitForURL('**/flows/**');
      await page.waitForSelector('.react-flow__nodes', { state: 'visible' });
      await page.waitForSelector('.react-flow__node', { state: 'visible' });
    },
  };
} 