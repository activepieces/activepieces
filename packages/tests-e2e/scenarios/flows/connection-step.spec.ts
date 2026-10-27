import { randomUUID } from 'node:crypto';
import { test } from '../../fixtures';
import { e2eFlows } from '../../fixtures/flows';

test.describe('Connection step', () => {
  test('a piece step sends the API key of its connection', async ({ automationsPage, builderPage, flowCleanup, connectionCleanup }) => {
    test.setTimeout(240000);
    const apiKey = `e2e-${randomUUID()}`;

    const { webhookUrl } = await test.step('Publish a flow that returns the Authorization header', () =>
      e2eFlows.publishWebhookEchoFlow({ automationsPage, builderPage, flowCleanup, responseBody: ECHO_AUTHORIZATION }),
    );

    await test.step('Add an Activepieces Platform step to a new flow', async () => {
      flowCleanup.track(await automationsPage.createFlow());
      await builderPage.nameNewFlow(e2eFlows.uniqueName('connection'));
      await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
      await builderPage.addStep({ after: 'trigger', piece: 'Activepieces Platform', action: 'Custom API Call' });
    });

    await test.step('Call the echo flow through a new connection', async () => {
      const connectionId = await builderPage.createConnection({
        name: e2eFlows.uniqueName('connection'),
        fields: { 'Base URL': webhookUrl, 'API Key': apiKey },
      });
      connectionCleanup.track(connectionId);
      await builderPage.setTextInput({ name: 'URL', value: '/sync' });
    });

    await test.step('Test the step and find the API key in the response', async () => {
      await builderPage.testStep();
      await builderPage.expectStepOutput({ key: 'authorization', value: `Bearer ${apiKey}` });
    });
  });
});

const ECHO_AUTHORIZATION = `{"authorization": "{{trigger['output']['headers']['authorization']}}"}`;
