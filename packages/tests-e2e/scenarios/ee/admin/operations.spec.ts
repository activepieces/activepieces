import { expect, test, WEBHOOK_PIECE } from '../../../fixtures/operations';
import webhookDelay from '../../../fixtures/templates/webhook-delay.json';
import webhookEcho from '../../../fixtures/templates/webhook-echo.json';
import { OperationsPage } from '../../../pages/operations.page';

test.describe('Operations', { tag: ['@feature:ops', '@surface'] }, () => {
  test.describe.configure({ timeout: 90_000 });

  test('the runs health and queue health pages show data', async ({ page, seed, operations }) => {
    const flow = await seed.flow({ template: webhookDelay, publish: true });
    await operations.callWebhook({ flow });
    await operations.expectUnfinishedRun({ flowId: flow.flowId });
    const operationsPage = new OperationsPage(page);

    const queue = await operationsPage.openQueueHealth();
    expect(queue.running + queue.queued, 'Queue health does not count the unfinished run of the spec').toBeGreaterThanOrEqual(1);
    await expect(operationsPage.stat('health-queue-running')).toHaveText(formatCount(queue.running));
    await expect(operationsPage.stat('health-queue-queued')).toHaveText(formatCount(queue.queued));

    await operations.expectRunSucceeded({ flowId: flow.flowId });
    const { summary } = await operationsPage.openRunsHealth();
    expect(summary.completed, 'Runs health does not count the succeeded run of the spec').toBeGreaterThanOrEqual(1);
    expect(summary.successRate).toBeGreaterThan(0);
    await expect(operationsPage.stat('health-runs-jobs-done')).toHaveText(formatCount(summary.completed));
    await expect(operationsPage.stat('health-runs-success-rate')).toHaveText(`${summary.successRate.toFixed(1)}%`);
  });

  test('the triggers page counts a webhook trigger run of the spec', async ({ page, seed, operations }) => {
    const runsBefore = await operations.webhookTriggerRuns();
    const flow = await seed.flow({ template: webhookEcho, publish: true });
    await operations.callWebhook({ flow });
    await operations.expectWebhookTriggerRuns({ moreThan: runsBefore });
    const operationsPage = new OperationsPage(page);

    const webhookRuns = await operationsPage.openTriggers({ pieceName: WEBHOOK_PIECE });

    expect(webhookRuns, 'The triggers page does not count the webhook trigger run of the spec').toBeGreaterThan(runsBefore);
    await expect(operationsPage.triggerTotalRuns('Webhook')).toHaveText(formatCount(webhookRuns));
  });
});

function formatCount(count: number): string {
  return count.toLocaleString('en-US');
}
