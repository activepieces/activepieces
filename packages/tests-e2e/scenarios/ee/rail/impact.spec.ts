import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as impactTest } from '../../../fixtures/impact';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';

const test = mergeTests(accessTest, impactTest);

test.describe('Impact isolation', { tag: ['@feature:impact', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('run counts of a different project do not show', async ({ seed, secondProject, viewer, impact }) => {
    const ownFlow = await seed.flow({ template: webhookEcho, publish: true });
    const otherFlow = await seed.flow({ template: webhookEcho, publish: true, session: secondProject.session });
    await impact.runFlow({ flow: ownFlow, count: 1 });
    await impact.runFlow({ flow: otherFlow, count: 2, session: secondProject.session });

    const viewerReport = await impact.refresh({ session: viewer.session });
    const viewerFlowIds = viewerReport.flows.map((flow) => flow.flowId);
    expect(viewerFlowIds, 'The viewer does not see the flow of its own project').toContain(otherFlow.flowId);
    expect(impact.runsOf({ report: viewerReport, flowId: otherFlow.flowId })).toBe(2);
    expect(viewerFlowIds).not.toContain(ownFlow.flowId);
    expect(impact.runsOf({ report: viewerReport, flowId: ownFlow.flowId })).toBe(0);

    const adminReport = await impact.read();
    expect(impact.runsOf({ report: adminReport, flowId: ownFlow.flowId }), 'The report never counted the run of the default project').toBe(1);
  });
});
