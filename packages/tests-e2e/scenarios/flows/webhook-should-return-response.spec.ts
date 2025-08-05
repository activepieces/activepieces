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

    await agentPage.actions.waitFor(page);

    await flowsPage.actions.navigate(page);

    await flowsPage.actions.cleanupExistingFlows(page);
    
    await flowsPage.actions.newFlowFromScratch(page);

    await builderPage.actions.waitUntilPageIsLoaded(page);

    await builderPage.actions.selectInitialTrigger(page, {
        piece: 'Webhook',
        trigger: 'Catch Webhook'
      });
    const webhookInput = builderPage.getters.webhookInput(page);
    const webhookUrl = await webhookInput.inputValue();
    const runVersion = Math.floor(Math.random() * 100000);
    const urlWithParams = `${webhookUrl}/sync?targetRunVersion=${runVersion}`;

    await page.waitForTimeout(2000);
    await builderPage.actions.testTrigger(page);

    const apiRequestToRunWebhook = await page.context().request;
    await apiRequestToRunWebhook.get(urlWithParams);
    await page.waitForTimeout(5000);

    await builderPage.actions.addAction(page, {
      piece: 'Webhook',
      action: 'Return Response'
    });

    await page.waitForTimeout(3000);

    await builderPage.actions.fillCodeEditor(page,
      '{"targetRunVersion": "{{trigger[\'queryParams\'][\'targetRunVersion\']}}"}'
    );

    await page.waitForTimeout(1000);
    await builderPage.actions.publishFlow(page);

    const response = await apiRequestToRunWebhook.get(urlWithParams);
    const body = await response.json();
    
    expect(body.targetRunVersion).toBe(runVersion.toString());
  });

}); 