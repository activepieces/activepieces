import { test } from '../../fixtures';
import manualRun from '../../fixtures/templates/manual-run.json';
import { RunsPage } from '../../pages/runs.page';
import { TriggersPage } from '../../pages/triggers.page';

test.describe('Triggers', { tag: '@feature:triggers' }, () => {
  test('run a flow from its manual trigger', async ({ page, seed }) => {
    test.setTimeout(120000);
    const triggersPage = new TriggersPage(page);
    const runsPage = new RunsPage(page);

    const flow = await seed.flow({ template: manualRun, publish: false });

    await test.step('Publish the flow in the builder and click Run Flow on the canvas', async () => {
      await triggersPage.visitFlow(flow.flowId);
      await triggersPage.publish();
      await triggersPage.runFlow();
    });

    await test.step('See the run succeed with the output of its step', async () => {
      await runsPage.openLatestRun({ flowId: flow.flowId, flowName: flow.flowName, status: 'Succeeded' });
      await triggersPage.openStep('step_1');
      await triggersPage.expectStepOutput({ key: 'greeting', value: 'hello from a manual run' });
    });
  });
});
