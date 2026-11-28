import { mergeTests } from '@playwright/test';
import { e2eApi } from '../../../fixtures/api';
import { test as projectsTest } from '../../../fixtures/projects';
import { test as runsListTest } from '../../../fixtures/runs-list';
import { UsagePage } from '../../../pages/usage.page';

const test = mergeTests(projectsTest, runsListTest);

test.describe('Usage', { tag: ['@feature:usage', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('the usage page counts the runs of a project', async ({ page, session, teamProjects, runsList }) => {
    const project = await teamProjects.create({ displayName: e2eApi.uniqueName('usage') });
    await runsList.seedFailedRuns({ prefix: runsList.newPrefix(), count: RUNS, session: { token: session.token, projectId: project.id } });
    const usagePage = new UsagePage(page);

    await usagePage.expectProjectRunCredits({ projectName: project.displayName, runs: RUNS });
  });
});

const RUNS = 3;
