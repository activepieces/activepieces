import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { globalConfig } from '../config';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  DashboardPage 
} from '../pages';

test.describe('Error Handling Scenarios', () => {
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

  test('should handle network connectivity issues', async ({ page }) => {
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

    await builderPage.actions.addAction(page, {
      piece: 'HTTP Request',
      action: 'Make HTTP Request'
    });

    await page.getByPlaceholder('URL').fill('https://invalid-url-that-does-not-exist.com');
    
    await builderPage.getters.testFlowButton(page).click();
    await page.waitForTimeout(5000);
    
    await expect(page.getByText('Connection failed')).toBeVisible();
  });

  test('should handle invalid data mapping', async ({ page }) => {
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

    await builderPage.actions.addAction(page, {
      piece: 'Data Mapper',
      action: 'Advanced Mapping'
    });

    await page.locator('div.cm-activeLine.cm-line').fill('{"invalid": json}');
    
    await builderPage.getters.testFlowButton(page).click();
    
    await expect(page.getByText('Invalid JSON format')).toBeVisible();
  });

  test('should handle timeout scenarios', async ({ page }) => {
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

    await page.getByPlaceholder('URL').fill('https://httpbin.org/delay/30');
    
    await builderPage.getters.testFlowButton(page).click();
    await page.waitForTimeout(10000);
    
    await expect(page.getByText('Request timeout')).toBeVisible();
  });
}); 