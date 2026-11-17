import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { test as runsListTest } from '../../../fixtures/runs-list';
import { RunsPage } from '../../../pages/runs.page';

const test = mergeTests(accessTest, runsListTest);

test.describe('Runs list', { tag: ['@feature:runs-list', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('runs of a different project do not show', async ({ page, secondProject, runsList }) => {
    const prefix = runsList.newPrefix();
    const own = await runsList.seedFailedRuns({ prefix, count: 1 });
    const other = await runsList.seedFailedRuns({ prefix, count: 1, session: secondProject.session });
    const runsPage = new RunsPage(page);

    await runsPage.visitWithErrorMessage(prefix);

    await expect(runsPage.rows(own.flowName)).toContainText('Failed');
    await expect(runsPage.rows(other.flowName)).toBeHidden();
  });
});
