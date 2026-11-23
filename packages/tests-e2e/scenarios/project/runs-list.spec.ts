import { mergeTests } from '@playwright/test';
import { e2eApi } from '../../fixtures/api';
import { expect, test as listResponseTest } from '../../fixtures/list-response';
import { test as runsListTest } from '../../fixtures/runs-list';
import { RunsPage } from '../../pages/runs.page';

const test = mergeTests(listResponseTest, runsListTest);

test.describe('Runs list', { tag: ['@feature:runs-list', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('retry the selected failed runs in bulk', async ({ page, runsList }) => {
    const prefix = runsList.newPrefix();
    const first = await runsList.seedFailedRuns({ prefix, count: 1 });
    const second = await runsList.seedFailedRuns({ prefix, count: 1 });
    const runsPage = new RunsPage(page);
    await runsPage.visitWithErrorMessage(prefix);
    await expect(runsPage.rows(first.flowName)).toContainText('Failed');
    await expect(runsPage.rows(second.flowName)).toContainText('Failed');

    await runsList.publishFix({ flowId: first.flowId });
    await runsList.publishFix({ flowId: second.flowId });
    await runsPage.selectRunsOf(first.flowName);
    await runsPage.selectRunsOf(second.flowName);
    const retriedIds = await runsPage.retrySelectedOnLatestVersion();

    expect(retriedIds).toHaveLength(2);
    expect(retriedIds).not.toContain(first.runIds[0]);
    expect(retriedIds).not.toContain(second.runIds[0]);
    await expect.poll(() => Promise.all(retriedIds.map((runId) => runsList.readRunStatus({ runId }))), { timeout: RUN_TIMEOUT_MS })
      .toEqual(['SUCCEEDED', 'SUCCEEDED']);

    await runsPage.viewRetriedRuns();
    await expect(runsPage.rows(first.flowName)).toContainText('Succeeded');
    await expect(runsPage.rows(second.flowName)).toContainText('Succeeded');
  });

  test('the runs table pages, filters and searches by the spec prefix', async ({ page, runsList }) => {
    const prefix = runsList.newPrefix();
    const paged = await runsList.seedFailedRuns({ prefix, count: PAGE_SIZE });
    const single = await runsList.seedFailedRuns({ prefix, count: 1 });
    const unmatched = await runsList.seedFailedRuns({ prefix: runsList.newPrefix(), count: 1 });
    const runsPage = new RunsPage(page);
    const prefixRows = runsPage.rows(paged.flowName).or(runsPage.rows(single.flowName));
    await runsPage.visit();

    await runsPage.filterByErrorMessage(prefix);
    await expect(prefixRows).toHaveCount(PAGE_SIZE);
    await expect(runsPage.rows(unmatched.flowName)).toBeHidden();

    await runsPage.nextPage();
    await expect(prefixRows).toHaveCount(1);

    await runsPage.filterByFlowName(single.flowName);
    await expect(runsPage.rows(single.flowName)).toHaveCount(1);
    await expect(runsPage.rows(paged.flowName)).toHaveCount(0);

    await page.reload();
    await expect(runsPage.errorMessageFilter()).toContainText(prefix);
    await expect(runsPage.rows(single.flowName)).toHaveCount(1);
    await expect(runsPage.rows(paged.flowName)).toHaveCount(0);
  });

  test('a runs filter with no match shows the empty state', async ({ page }) => {
    const runsPage = new RunsPage(page);

    await runsPage.visitWithErrorMessage(e2eApi.uniqueName('no match'));

    await expect(runsPage.emptyState()).toContainText('No flow runs found');
  });

  test('a failed runs request shows the error state', async ({ page, runsList, listResponse }) => {
    const prefix = runsList.newPrefix();
    const { flowName } = await runsList.seedFailedRuns({ prefix, count: 1 });
    const restoreRuns = await listResponse.fail({ resource: 'flow-runs' });
    const runsPage = new RunsPage(page);

    await runsPage.visitWithErrorMessage(prefix);
    await expect(runsPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });

    await restoreRuns();
    await runsPage.retryAfterError();
    await expect(runsPage.rows(flowName)).toContainText('Failed');
    await expect(runsPage.errorState()).toBeHidden();
  });
});

const PAGE_SIZE = 10;
const RUN_TIMEOUT_MS = 60_000;
