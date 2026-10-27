import { randomUUID } from 'node:crypto';
import { test } from '../../fixtures';
import { e2eFlows } from '../../fixtures/flows';

test.describe('Connection step', () => {
  test('a piece step sends the API key of its connection', async ({ automationsPage, builderPage, runsPage, flowCleanup, connectionCleanup }) => {
    test.setTimeout(240000);
    const apiKey = `e2e-${randomUUID()}`;

    const echo = await test.step('Publish a webhook flow for the step to call', () =>
      e2eFlows.publishWebhookEchoFlow({ automationsPage, builderPage, flowCleanup }),
    );

    await test.step('Add an Activepieces Platform step to a new flow', async () => {
      flowCleanup.track(await automationsPage.createFlow());
      await builderPage.nameNewFlow(e2eFlows.uniqueName('connection'));
      await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
      await builderPage.addStep({ after: 'trigger', piece: 'Activepieces Platform', action: 'Custom API Call' });
    });

    await test.step('Call the webhook flow through a new connection', async () => {
      const connectionId = await builderPage.createConnection({
        name: e2eFlows.uniqueName('connection'),
        fields: { 'Base URL': echo.webhookUrl, 'API Key': apiKey },
      });
      connectionCleanup.track(connectionId);
      await builderPage.setTextInput({ name: 'URL', value: '/' });
      await builderPage.testStep();
    });

    await test.step('Find the API key in the request the webhook flow received', async () => {
      await runsPage.openLatestRun({ flowId: echo.flowId, flowName: echo.flowName, status: 'Succeeded' });
      await builderPage.openStep('trigger');
      await builderPage.expandStepOutput('headers');
      await builderPage.expectStepOutput({ key: 'authorization', value: `Bearer ${apiKey}` });
    });
  });
});
