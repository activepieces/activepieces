import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { globalConfig } from '../config';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  DashboardPage 
} from '../pages';

test.describe('Flow Management Scenarios', () => {
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

  test('should create and delete multiple workflows', async ({ page }) => {
    test.setTimeout(150000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);

    const workflowNames = ['Test Workflow 1', 'Test Workflow 2', 'Test Workflow 3'];

    for (const workflowName of workflowNames) {
      await flowsPage.actions.newFlowFromScratch(page);
      
      await page.getByRole('textbox', { name: 'Flow name' }).fill(workflowName);
      
      await builderPage.actions.selectInitialTrigger(page, {
        piece: 'Schedule',
        trigger: 'Every Day'
      });

      await builderPage.actions.addAction(page, {
        piece: 'Data Mapper',
        action: 'Advanced Mapping'
      });

      await builderPage.actions.clickHome(page);
    }

    for (const workflowName of workflowNames) {
      await expect(page.getByText(workflowName)).toBeVisible();
    }

    for (const workflowName of workflowNames) {
      await flowsPage.actions.deleteFlow(page, { flowName: workflowName });
    }

    for (const workflowName of workflowNames) {
      await expect(page.getByText(workflowName)).not.toBeVisible();
    }
  });

  test('should publish and unpublish workflows', async ({ page }) => {
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

    // Publish workflow
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForTimeout(5000);
    
    await expect(page.getByText('Published')).toBeVisible();
    
    await page.getByRole('button', { name: 'Unpublish' }).click();
    await page.waitForTimeout(3000);
    
    await expect(page.getByText('Draft')).toBeVisible();
  });

  test('should duplicate workflows', async ({ page }) => {
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

    await page.getByRole('textbox', { name: 'Flow name' }).fill('Original Workflow');
    
    await builderPage.actions.clickHome(page);

    await page.getByRole('row', { name: /^Original Workflow/ }).getByRole('button').first().click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    
    await expect(page.getByText('Original Workflow (Copy)')).toBeVisible();
  });

  test('should search and filter workflows', async ({ page }) => {
    test.setTimeout(150000);
    
    const email = faker.internet.email();
    
    await authenticationPage.actions.signUp(page, {
      email: email,
      password: globalConfig.password
    });

    await dashboardPage.actions.waitFor(page);

    const workflows = [
      { name: 'Marketing Workflow', tag: 'marketing' },
      { name: 'Sales Workflow', tag: 'sales' },
      { name: 'Support Workflow', tag: 'support' }
    ];

    for (const workflow of workflows) {
      await flowsPage.actions.newFlowFromScratch(page);
      await page.getByRole('textbox', { name: 'Flow name' }).fill(workflow.name);
      
      await builderPage.actions.selectInitialTrigger(page, {
        piece: 'Schedule',
        trigger: 'Every Day'
      });

      await builderPage.actions.addAction(page, {
        piece: 'Data Mapper',
        action: 'Advanced Mapping'
      });

      await page.getByRole('button', { name: 'Add tag' }).click();
      await page.getByPlaceholder('Enter tag name').fill(workflow.tag);
      await page.getByRole('button', { name: 'Add' }).click();

      await builderPage.actions.clickHome(page);
    }

    await page.getByPlaceholder('Search workflows').fill('Marketing');
    await expect(page.getByText('Marketing Workflow')).toBeVisible();
    await expect(page.getByText('Sales Workflow')).not.toBeVisible();

    await page.getByPlaceholder('Search workflows').clear();
    await expect(page.getByText('Sales Workflow')).toBeVisible();

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByText('marketing').click();
    await expect(page.getByText('Marketing Workflow')).toBeVisible();
    await expect(page.getByText('Sales Workflow')).not.toBeVisible();
  });

  test('should handle workflow versioning', async ({ page }) => {
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

    await page.getByText('Data Mapper').click();
    await page.locator('div.cm-activeLine.cm-line').fill('{"version": "1.0"}');

    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForTimeout(5000);

    await page.getByRole('button', { name: 'Version History' }).click();
    await expect(page.getByText('Version 2')).toBeVisible();
    await expect(page.getByText('Version 1')).toBeVisible();
  });

  test('should handle workflow sharing', async ({ page }) => {
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

    await page.getByRole('textbox', { name: 'Flow name' }).fill('Shared Workflow');
    await builderPage.actions.clickHome(page);

    await page.getByRole('row', { name: /^Shared Workflow/ }).getByRole('button').first().click();
    await page.getByRole('menuitem', { name: 'Share' }).click();
    
    await page.getByRole('button', { name: 'Generate link' }).click();
    await page.getByRole('button', { name: 'Copy link' }).click();
    
    await expect(page.getByText('Share Workflow')).toBeVisible();
    await expect(page.getByText('Link copied')).toBeVisible();
  });
}); 