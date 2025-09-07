import { test } from '@playwright/test';
import { 
  AuthenticationPage, 
  FlowsPage, 
  BuilderPage, 
  AgentPage,
} from '../../pages';
import { configUtils } from '../../helper/config';

test.describe('Slack Integration', () => {
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

    const config = configUtils.getConfig();
    const channel = 'spam';
    
    await authenticationPage.actions.signIn(page, {
      email: config.email,
      password: config.password
    });

    await flowsPage.actions.waitFor(page);

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

}); 