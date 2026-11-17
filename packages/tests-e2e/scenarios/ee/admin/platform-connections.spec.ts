import { randomUUID } from 'node:crypto';
import { E2E_PREFIX } from '../../../fixtures/api';
import { e2eFlows } from '../../../fixtures/flows';
import { expect, test } from '../../../fixtures/platform-connections';
import { AutomationsPage } from '../../../pages/automations.page';
import { BuilderPage } from '../../../pages/builder.page';
import { PlatformConnectionsPage } from '../../../pages/platform-connections.page';
import { RunsPage } from '../../../pages/runs.page';

test.describe('Platform connections', { tag: ['@feature:pconn', '@surface'] }, () => {
  test('create a global connection and use it in a flow of a project', async ({ page, seed, cleanup, defaultProjectLabel }) => {
    const connectionsPage = new PlatformConnectionsPage(page);
    const automationsPage = new AutomationsPage(page);
    const builderPage = new BuilderPage(page);
    const runsPage = new RunsPage(page);
    test.setTimeout(240000);
    const apiKey = `e2e-${randomUUID()}`;
    const connectionName = e2eFlows.uniqueName('global connection');

    const echo = await test.step('Publish a webhook flow for the step to call', () =>
      e2eFlows.publishWebhookEchoFlow({ seed }),
    );

    await test.step('Create a global connection for the project', async () => {
      await connectionsPage.visitGlobal();
      const connectionId = await connectionsPage.createGlobalConnection({
        pieceName: 'Activepieces Platform',
        name: connectionName,
        fields: { 'Base URL': echo.webhookUrl, 'API Key': apiKey },
        project: defaultProjectLabel,
      });
      cleanup.track({ resource: 'global-connections', id: connectionId });
    });

    await test.step('Pick the global connection in a step of a new flow', async () => {
      cleanup.track({ resource: 'flows', id: await automationsPage.createFlow() });
      await builderPage.nameNewFlow(e2eFlows.uniqueName('global connection'));
      await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
      await builderPage.addStep({ after: 'trigger', piece: 'Activepieces Platform', action: 'Custom API Call' });
      await connectionsPage.pickConnectionInStep(connectionName);
      await builderPage.expectStepPanelText(`relative to ${new URL(echo.webhookUrl).origin}`);
      await builderPage.setTextInput({ name: 'URL', value: '/' });
      await builderPage.testStep();
    });

    await test.step('Find the API key of the global connection in the request', async () => {
      await runsPage.openLatestRun({ flowId: echo.flowId, flowName: echo.flowName, status: 'Succeeded' });
      await builderPage.openStep('trigger');
      await builderPage.expandStepOutput('headers');
      await builderPage.expectStepOutput({ key: 'authorization', value: `Bearer ${apiKey}` });
    });
  });

  test('the all-connections table searches by the spec prefix', async ({ page, platformConnections }) => {
    const connectionsPage = new PlatformConnectionsPage(page);
    test.setTimeout(120000);
    const prefix = e2eFlows.uniqueName('pconn');

    await test.step('Seed a global and a project connection with the prefix, and one more without it', async () => {
      await platformConnections.seedGlobal({ displayName: `${prefix} global` });
      await platformConnections.seedInProject({ displayName: `${prefix} project` });
      await platformConnections.seedInProject({ displayName: e2eFlows.uniqueName('pconn other') });
    });

    await test.step('Search the All table by the prefix', async () => {
      await connectionsPage.visit();
      await connectionsPage.filterByName(prefix);
      await expect(connectionsPage.row(`${prefix} global`)).toBeVisible();
      await expect(connectionsPage.row(`${prefix} project`)).toBeVisible();
      await expect(connectionsPage.rowsMatching(E2E_PREFIX)).toHaveCount(2);
    });
  });
});
