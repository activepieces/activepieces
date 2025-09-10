import { test, expect } from '@playwright/test';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  AgentPage,
} from '../../pages';
import { configUtils } from '../../helper/config';

test.describe('Webhooks', () => {
  let authenticationPage: AuthenticationPage;
  let flowsPage: FlowsPage;
  let builderPage: BuilderPage;
  let agentPage: AgentPage;

  test.beforeEach(async () => {
    authenticationPage = new AuthenticationPage();
    flowsPage = new FlowsPage();
    builderPage = new BuilderPage();
    agentPage = new AgentPage();
  });

  test('should handle webhook with return response', async ({ page }) => {
    test.setTimeout(120000);

    const config = configUtils.getConfig();
    
    await authenticationPage.actions.signIn(page, {
      email: config.email,
      password: config.password
    });

    await flowsPage.actions.waitFor(page);

    await flowsPage.actions.navigate(page);

    await flowsPage.actions.cleanupExistingFlows(page);
    
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.waitFor(page);

    await page.locator('div[data-testid="rf__node-trigger"]')
      .filter({ hasText: 'Select Trigger' })
      .click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Catch Webhook');
    await page.getByText('Catch Webhook').click();
    await page.waitForTimeout(2000);

    const webhookInput = builderPage.getters.webhookInput(page);
    const webhookUrl = await webhookInput.inputValue();
    const runVersion = Math.floor(Math.random() * 100000);
    const urlWithParams = `${webhookUrl}/sync?targetRunVersion=${runVersion}`;

    await page.waitForTimeout(2000);
    await builderPage.actions.testTrigger(page);

    const apiRequest = await page.context().request;
    await apiRequest.get(urlWithParams);
    await page.waitForTimeout(5000);

    await page.locator('div.bg-light-blue').click();
    await page.getByRole('textbox', { name: 'Search' }).fill('Webhook');
    await page.getByText('Return Response').nth(1).click();
    await page.waitForTimeout(3000);

    await builderPage.actions.fillCodeEditor(page,
      '{"targetRunVersion": "{{trigger[\'queryParams\'][\'targetRunVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await builderPage.actions.publishFlow(page);

    const response = await apiRequest.get(urlWithParams);
    const body = await response.json();
    
    expect(body.targetRunVersion).toBe(runVersion.toString());
  });

}); 