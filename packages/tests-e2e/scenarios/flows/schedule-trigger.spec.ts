import { test } from '../../fixtures';
import { e2eApi } from '../../fixtures/api';
import { e2eFlows } from '../../fixtures/flows';
import { AutomationsPage } from '../../pages/automations.page';
import { BuilderPage } from '../../pages/builder.page';
import { RunsPage } from '../../pages/runs.page';

test.describe('Schedule trigger', () => {
  test('a published flow on a one-minute schedule runs by itself', async ({ page, cleanup, request, session }) => {
    const automationsPage = new AutomationsPage(page);
    const builderPage = new BuilderPage(page);
    const runsPage = new RunsPage(page);
    test.setTimeout(240000);
    const flowName = e2eFlows.uniqueName('schedule');

    const flowId = await test.step('Create a flow that runs every minute', async () => {
      const id = await automationsPage.createFlow();
      cleanup.track({ resource: 'flows', id });
      await builderPage.nameNewFlow(flowName);
      await builderPage.selectTrigger({ piece: 'Schedule', trigger: 'Every X Minutes' });
      return id;
    });

    const publishedAt = await test.step('Publish the flow', async () => {
      await builderPage.publish();
      return Date.now();
    });

    await test.step('See a scheduled run succeed in the run history', async () => {
      await runsPage.expectLatestRun({ flowId, flowName, status: 'Succeeded', timeout: 150000 }).catch(async (error: Error) => {
        const flowState = await e2eApi.describeFlow({ request, session, flowId });
        const seconds = Math.round((Date.now() - publishedAt) / 1000);
        throw new Error(`${error.message}\n${seconds} s after publish\n${flowState}`);
      });
    });
  });
});
