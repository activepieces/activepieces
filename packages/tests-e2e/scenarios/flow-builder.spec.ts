import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { globalConfig } from '../config';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  DashboardPage 
} from '../pages';

test.describe('Workflow Builder Scenarios', () => {
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

  test('should create basic workflow from scratch', async ({ page }) => {
    test.setTimeout(100000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    await flowsPage.actions.newFlowFromScratch(page);

    await expect(page).toHaveURL(/.*builder/);
    await expect(builderPage.getters.selectTriggerButton(page)).toBeVisible();
  });

  test('should configure schedule trigger and test flow', async ({ page }) => {
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

    await builderPage.actions.selectDropdown(page, {
      property: 'Time Zone',
      value: 'UTC'
    });

    await builderPage.actions.selectDropdown(page, {
      property: 'Hour',
      value: '12'
    });

    await builderPage.getters.testFlowButton(page).click();
    await page.waitForTimeout(5000);
    
    await expect(page.getByText('Every Day')).toBeVisible();
    await expect(page.getByText('UTC')).toBeVisible();
  });

  test('should add action and test complete flow', async ({ page }) => {
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
      piece: 'Data Mapper',
      action: 'Advanced Mapping'
    });

    await builderPage.actions.testFlowAndWaitForSuccess(page);
    
    await expect(builderPage.getters.runSucceededText(page)).toBeVisible();
    
    await builderPage.actions.exitRun(page);
  });

  test('should handle multiple actions in workflow', async ({ page }) => {
    test.setTimeout(150000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.selectInitialTrigger(page, {
      piece: 'Schedule',
      trigger: 'Every Hour'
    });

    await builderPage.actions.addAction(page, {
      piece: 'Data Mapper',
      action: 'Advanced Mapping'
    });

    await builderPage.actions.addAction(page, {
      piece: 'HTTP Request',
      action: 'Make HTTP Request'
    });

    await builderPage.actions.selectDropdown(page, {
      property: 'Method',
      value: 'GET'
    });

    await page.getByPlaceholder('URL').fill('https://httpbin.org/get');

    await builderPage.actions.testFlowAndWaitForSuccess(page);
    
    await builderPage.actions.exitRun(page);
  });

  test('should handle workflow with webhook trigger', async ({ page }) => {
    test.setTimeout(120000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.selectInitialTrigger(page, {
      piece: 'Webhook',
      trigger: 'Webhook Received'
    });

    const webhookInput = page.locator('input.grow.bg-background');
    await webhookInput.waitFor({ state: 'visible' });
    const webhookUrl = await webhookInput.inputValue();
    
    expect(webhookUrl).toContain('http');

    await builderPage.actions.addAction(page, {
      piece: 'Return Response',
      action: 'Return Response'
    });

    await page.locator('div.cm-activeLine.cm-line').fill(
      '{"message": "Webhook received successfully"}'
    );

    await builderPage.getters.testFlowButton(page).click();
    await page.waitForTimeout(5000);

    const response = await page.context().request.get(webhookUrl);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.message).toBe('Webhook received successfully');
  });

  test('should handle workflow errors gracefully', async ({ page }) => {
    test.setTimeout(100000);
    
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

    await builderPage.getters.testFlowButton(page).click();
    
    await expect(page.getByText('Configuration required')).toBeVisible();
  });

  test('should publish and manage workflow', async ({ page }) => {
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
      piece: 'Data Mapper',
      action: 'Advanced Mapping'
    });

    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForTimeout(5000);
    
    await expect(page.getByText('Published')).toBeVisible();
    
    await builderPage.actions.clickHome(page);
    
    await expect(page.getByText('Untitled')).toBeVisible();
  });
}); 