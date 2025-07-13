import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { globalConfig } from '../config';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  DashboardPage 
} from '../pages';

test.describe('Integration Scenarios', () => {
  let authenticationPage: AuthenticationPage;
  let flowsPage: FlowsPage;
  let builderPage: BuilderPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async () => {
    authenticationPage = new AuthenticationPage();
    flowsPage = new FlowsPage();
    builderPage = new BuilderPage();
    dashboardPage = new DashboardPage();
  });

  test('should send Slack message via workflow', async ({ page }) => {
    test.setTimeout(120000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    
    await page.getByRole('button', { name: 'Slack E2E' }).first().click();
    
    await cleanupExistingFlows(page);
    
    await page.getByRole('button', { name: 'Create Flow' }).click();
    await page.getByText('From scratch').click();

    await page.locator('div[data-testid="rf__node-trigger"]')
      .filter({ hasText: 'Select Trigger' })
      .click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Every Hour');
    await page.getByText('Every Hour').click();
    await page.waitForTimeout(2000);

    const dismissButton = page.getByRole('button', { name: 'Dismiss' });
    if (await dismissButton.isVisible()) {
      await dismissButton.click();
    }

    await page.getByText('Load Sample data').click();
    await page.waitForTimeout(8000);

    await page.locator('div.bg-light-blue').click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Slack');
    await page.getByText('Slack', { exact: true }).click();
    await page.getByText('Send Message To A Channel').click();

    await page.locator('button').filter({ hasText: 'Select a connection' }).click();
    await page.getByLabel('slack').click();
    await page.waitForTimeout(2000);

    await page.locator('button').filter({ hasText: 'Select channel' }).click();
    await page.waitForFunction(() => {
      const channelElement = document.querySelector('body');
      if (channelElement?.textContent && channelElement.textContent.includes('Channel')) {
        return channelElement;
      }
    }, { timeout: 10000 });
    await page.getByText('spam').click();

    await page.locator('div').filter({ hasText: /^Message \*The text of your message$/ })
      .locator('div').nth(3).click();
    await page.locator('div').filter({ hasText: /^Message \*The text of your message$/ })
      .locator('div').nth(3).fill('Test From checkly');

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Test Step Ctrl + G' }).click();
    await page.waitForTimeout(8000);

    await page.getByRole('button', { name: 'Test Flow' }).click();
    await page.waitForTimeout(1000);

    const runSuccessLocator = page.locator('text=Run Succeeded');
    const runSuccessText = await runSuccessLocator.textContent({ timeout: 60000 });
    expect(runSuccessText).toContain('Run Succeeded');

    await page.getByRole('button', { name: 'Exit Run' }).click();
  });

  test('should handle webhook with dynamic parameters', async ({ page }) => {
    test.setTimeout(120000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    
    // Navigate to Webhook E2E environment
    await page.getByRole('button', { name: 'Webhook E2E' }).first().click();
    
    await cleanupExistingFlows(page);
    
    await page.getByRole('button', { name: 'Create Flow' }).click();
    await page.getByText('From scratch').click();

    await page.locator('div[data-testid="rf__node-trigger"]')
      .filter({ hasText: 'Select Trigger' })
      .click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Catch Webhook');
    await page.getByText('Catch Webhook').click();
    await page.waitForTimeout(2000);

    const webhookInput = await page.locator('input.grow.bg-background');
    const webhookUrl = await webhookInput.inputValue();
    const runVersion = Math.floor(Math.random() * 100000);
    const urlWithParams = `${webhookUrl}/sync?targetRunVersion=${runVersion}`;

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Test Trigger Ctrl + G' }).click();
    await page.waitForTimeout(5000);

    const apiRequest = await page.context().request;
    await apiRequest.get(urlWithParams);
    await page.waitForTimeout(5000);

    await page.locator('div.bg-light-blue').click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Return Response');
    await page.getByText('Return Response').nth(1).click();
    await page.waitForTimeout(3000);

    await page.locator('div.cm-activeLine.cm-line').fill(
      '{"targetRunVersion": "{{trigger[\'queryParams\'][\'targetRunVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForTimeout(25000);

    const response = await apiRequest.get(urlWithParams);
    const body = await response.json();
    
    expect(body.targetRunVersion).toBe(runVersion.toString());
  });

  test('should handle HTTP request integration', async ({ page }) => {
    test.setTimeout(120000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.selectInitialTrigger(page, {
      piece: 'Schedule',
      trigger: 'Every Day'
    });

    await builderPage.actions.addAction(page, {
      piece: 'HTTP Request',
      action: 'Make HTTP Request'
    });

    await builderPage.actions.selectDropdown(page, {
      property: 'Method',
      value: 'GET'
    });

    await page.getByPlaceholder('URL').fill('https://httpbin.org/json');

    await builderPage.actions.testFlowAndWaitForSuccess(page);
    
    await builderPage.actions.exitRun(page);
  });

  test('should handle data mapping between actions', async ({ page }) => {
    test.setTimeout(120000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.selectInitialTrigger(page, {
      piece: 'Schedule',
      trigger: 'Every Day'
    });

    // Add data mapper action
    await builderPage.actions.addAction(page, {
      piece: 'Data Mapper',
      action: 'Advanced Mapping'
    });

    await page.locator('div.cm-activeLine.cm-line').fill(
      '{"message": "Hello from workflow", "timestamp": "{{now()}}"}'
    );

    await builderPage.actions.addAction(page, {
      piece: 'HTTP Request',
      action: 'Make HTTP Request'
    });

    await builderPage.actions.selectDropdown(page, {
      property: 'Method',
      value: 'POST'
    });

    await page.getByPlaceholder('URL').fill('https://httpbin.org/post');
    
    await page.getByPlaceholder('Body').fill('{{previousStep["message"]}}');

    await builderPage.actions.testFlowAndWaitForSuccess(page);
    
    await builderPage.actions.exitRun(page);
  });
});

async function cleanupExistingFlows(page) {
  while ((await page.locator('span.text-muted-foreground').count()) > 1) {
    if (!(await page.locator('td:nth-child(7)').first().count())) break;
    await page.locator('td:nth-child(7)').first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const confirmButton = await page.getByRole('button', { name: 'Remove' });
    await confirmButton.click();
    await page.waitForSelector('button:has-text("Remove")', { state: 'hidden' });
    await page.reload();
  }
} 