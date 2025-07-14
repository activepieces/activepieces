import { test, expect } from '@playwright/test';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  AgentPage,
} from '../pages';
import { globalConfig } from '../config';

test.describe('Integration Scenarios', () => {
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

  test('should send Slack message via flow', async ({ page }) => {
    test.setTimeout(120000);

    await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' });
    await page.setExtraHTTPHeaders({ 'ngrok-skip-browser-warning': 'true' });

    const channel = 'spam';
    
    await authenticationPage.actions.signIn(page, {
      email: globalConfig.email,
      password: globalConfig.password
    });

    await agentPage.actions.waitFor(page);

    await flowsPage.actions.navigate(page);

    await flowsPage.actions.cleanupExistingFlows(page);
    
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.waitFor(page);

    await builderPage.actions.selectInitialTrigger(page, {
      piece: 'Schedule',
      trigger: 'Every Hour'
    });

    await builderPage.actions.handleDismissButton(page);
    await builderPage.actions.loadSampleData(page);

    await builderPage.actions.addAction(page, {
      piece: 'Slack',
      action: 'Send Message To A Channel'
    });

    await builderPage.actions.selectSlackConnection(page);
    await builderPage.actions.selectSlackChannel(page, channel);
    await builderPage.actions.fillSlackMessage(page, 'Test From checkly');

    await page.waitForTimeout(2000);
    await builderPage.actions.testStep(page);

    await builderPage.actions.testFlowAndWaitForSuccess(page);
    
    await builderPage.actions.exitRun(page);
  });

  test('should handle webhook with dynamic parameters', async ({ page }) => {
    test.setTimeout(120000);

    await page.setExtraHTTPHeaders({ 'Cache-Control': 'no-cache' });
    await page.setExtraHTTPHeaders({ 'ngrok-skip-browser-warning': 'true' });

    const email = process.env.E2E_EMAIL ?? globalConfig.email;
    const password = process.env.E2E_PASSWORD ?? globalConfig.password;
    
    await authenticationPage.actions.signIn(page, {
      email: email,
      password: password
    });

    await agentPage.actions.waitFor(page);

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