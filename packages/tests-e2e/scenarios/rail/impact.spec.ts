import { expect, test } from '../../fixtures/impact';
import webhookEcho from '../../fixtures/templates/webhook-echo.json';
import { ImpactPage } from '../../pages/impact.page';

test.describe('Impact', { tag: ['@feature:impact', '@surface'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  test('the impact page counts the runs of the spec flows', async ({ page, seed, impact }) => {
    const flow = await seed.flow({ template: webhookEcho, publish: true });
    await impact.setTimeSavedPerRun({ flowId: flow.flowId, seconds: SEVEN_MINUTES });
    await impact.runFlow({ flow, count: 3 });
    const impactPage = new ImpactPage(page);

    await impactPage.visit();
    const report = await impactPage.refresh();
    expect(impact.runsOf({ report, flowId: flow.flowId })).toBe(3);

    await impactPage.searchFlows(flow.flowName);
    await expect(impactPage.timeSavedOf(flow.flowName), 'Total Time Saved is 3 runs of 7 minutes').toHaveText('21m');
  });
});

const SEVEN_MINUTES = 7 * 60;
