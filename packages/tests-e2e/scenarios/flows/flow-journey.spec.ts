import { randomInt } from 'node:crypto';
import { test } from '../../fixtures';
import { e2eFlows } from '../../fixtures/flows';

test.describe('Flow journey', () => {
  test('build, test, publish and run a webhook flow with a code step', async ({ automationsPage, builderPage, runsPage, flowCleanup }) => {
    test.setTimeout(240000);
    const flowName = e2eFlows.uniqueName('journey');
    const sampleValue = randomInt(1, 1000000);
    const liveValue = randomInt(1, 1000000);

    const flowId = await test.step('Create a flow from the automations page', async () => {
      const id = await automationsPage.createFlow();
      flowCleanup.track(id);
      await builderPage.nameNewFlow(flowName);
      return id;
    });

    const webhookUrl = await test.step('Catch a webhook and capture sample data', async () => {
      await builderPage.selectTrigger({ piece: 'Webhook', trigger: 'Catch Webhook' });
      const url = await builderPage.webhookUrl();
      await builderPage.testWebhookTrigger({ webhookUrl: url, value: sampleValue });
      return url;
    });

    await test.step('Double the value in a code step and test it', async () => {
      await builderPage.addStep({ after: 'trigger', piece: 'Code', action: 'Code' });
      await builderPage.setCodeInput({ key: 'value', value: "{{trigger['output']['queryParams']['value']}}" });
      await builderPage.setCode(DOUBLE_THE_VALUE);
      await builderPage.testStep();
      await builderPage.expectStepOutput({ key: 'doubled', value: String(sampleValue * 2) });
    });

    await test.step('Return the code output and test the whole flow', async () => {
      await builderPage.addStep({ after: 'step_1', piece: 'Webhook', action: 'Return Response' });
      await builderPage.setJsonBody(`{"doubled": "{{step_1['output']['doubled']}}"}`);
      await builderPage.testFlow();
    });

    await test.step('Publish and call the live webhook', async () => {
      await builderPage.publish();
      await builderPage.expectSyncWebhookResponse({
        url: `${webhookUrl}/sync?value=${liveValue}`,
        expected: { doubled: liveValue * 2 },
      });
    });

    await test.step('See the live run in the run history', async () => {
      await runsPage.expectLatestRun({ flowId, flowName, status: 'Succeeded' });
    });
  });
});

const DOUBLE_THE_VALUE = `export const code = async (inputs) => {
  return { doubled: Number(inputs.value) * 2 };
};`;
