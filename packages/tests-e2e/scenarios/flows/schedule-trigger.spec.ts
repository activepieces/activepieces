import { test } from '../../fixtures';
import { e2eFlows } from '../../fixtures/flows';

test.describe('Schedule trigger', () => {
  test('a published flow on a one-minute schedule runs by itself', async ({ automationsPage, builderPage, runsPage, flowCleanup }) => {
    test.setTimeout(240000);
    const flowName = e2eFlows.uniqueName('schedule');

    const flowId = await test.step('Create a flow that runs every minute', async () => {
      const id = await automationsPage.createFlow();
      flowCleanup.track(id);
      await builderPage.nameNewFlow(flowName);
      await builderPage.selectTrigger({ piece: 'Schedule', trigger: 'Every X Minutes' });
      return id;
    });

    await test.step('Publish the flow', async () => {
      await builderPage.publish();
    });

    await test.step('See a scheduled run succeed in the run history', async () => {
      await runsPage.expectLatestRun({ flowId, flowName, status: 'Succeeded', timeout: 150000 });
    });
  });
});
