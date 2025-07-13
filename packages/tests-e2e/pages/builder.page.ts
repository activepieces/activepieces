import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base';

export class BuilderPage extends BasePage {
  url = '/builder';

  getters = {
    selectTriggerButton: (page: Page) => page.getByText('Select Trigger', { exact: true }),
    searchPlaceholder: (page: Page) => page.getByPlaceholder('Search'),
    triggerSelectField: (page: Page) => page.locator('mat-form-field div').filter({ hasText: 'Trigger Select a Trigger' }).first(),
    selectActionButton: (page: Page) => page.getByText('Select an Action', { exact: true }),
    addButton: (page: Page) => page.locator('app-small-add-button div').first(),
    testFlowButton: (page: Page) => page.getByText('Test flow'),
    runSucceededText: (page: Page) => page.locator('//*[contains(text(),"Run succeeded")]'),
    exitRunButton: (page: Page) => page.getByRole('button', { name: 'Exit Run' }),
    homeButton: (page: Page) => page.getByLabel('Home'),
    connectionComboBox: (page: Page) => page.getByRole('combobox', { name: 'Connection' }).locator('span'),
    propertyDropdown: (page: Page, property: string) => page.getByText(property, { exact: true }),
  };

  actions = {
    selectInitialTrigger: async (page: Page, params: { piece: string; trigger: string }) => {
      await this.getters.selectTriggerButton(page).click();
      await this.getters.searchPlaceholder(page).click();
      await this.getters.searchPlaceholder(page).fill(params.piece);
      await page.getByAltText(params.piece).click();

      await this.getters.triggerSelectField(page).click();
      await page.getByText(params.trigger, { exact: true }).click();
      await page.waitForTimeout(5000);
    },

    addAction: async (page: Page, params: { piece: string; action: string }) => {
      await this.getters.addButton(page).click();
      await this.getters.searchPlaceholder(page).click();
      await this.getters.searchPlaceholder(page).fill(params.piece);
      await page.getByText(params.piece).click();

      await this.getters.selectActionButton(page).click();
      await page.getByText(params.action, { exact: true }).click();
    },

    testFlowAndWaitForSuccess: async (page: Page) => {
      await this.getters.testFlowButton(page).click();
      await page.waitForSelector('//*[contains(text(),"Run succeeded")]');
      const runSuccessText = await this.getters.runSucceededText(page).textContent();
      expect(runSuccessText).toContain('Run succeeded');
    },

    exitRun: async (page: Page) => {
      await this.getters.exitRunButton(page).click();
    },

    clickHome: async (page: Page) => {
      await this.getters.homeButton(page).click();
    },

    selectConnection: async (page: Page, params: { connection: string }) => {
      await this.getters.connectionComboBox(page).click();
      await page.getByText(params.connection, { exact: true }).click();
    },

    selectDropdown: async (page: Page, params: { property: string; value: string }) => {
      await this.getters.propertyDropdown(page, params.property).click();
      await page.getByText(params.value).click();
    },
  };
} 