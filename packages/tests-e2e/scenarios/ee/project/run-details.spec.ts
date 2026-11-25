import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { e2eApi } from '../../../fixtures/api';
import { test as runsListTest } from '../../../fixtures/runs-list';

const test = mergeTests(accessTest, runsListTest);

test.describe('Run details and retry', { tag: '@feature:run-details' }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('a viewer cannot retry a run: the server refuses', async ({ request, viewer, secondProject, runsList }) => {
    const { runIds: [runId] } = await runsList.seedFailedRuns({ prefix: runsList.newPrefix(), count: 1, session: secondProject.session });
    const runPath = `/api/v1/flow-runs/${runId}`;

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: runPath })).toBe(200);
    expect(await e2eApi.callApiStatus({
      request,
      session: viewer.session,
      method: 'POST',
      path: `${runPath}/retry`,
      data: { strategy: 'FROM_FAILED_STEP', projectId: secondProject.id },
    })).toBe(403);
    expect(await runsList.readRunStatus({ runId })).toBe('FAILED');
  });

  test('a user of another project cannot read or retry a run', async ({ request, session, viewer, runsList }) => {
    const { runIds: [runId] } = await runsList.seedFailedRuns({ prefix: runsList.newPrefix(), count: 1 });
    const runPath = `/api/v1/flow-runs/${runId}`;

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: runPath })).toBe(403);
    expect(await e2eApi.callApiStatus({
      request,
      session: viewer.session,
      method: 'POST',
      path: `${runPath}/retry`,
      data: { strategy: 'ON_LATEST_VERSION', projectId: session.projectId },
    })).toBe(403);
    expect(await runsList.readRunStatus({ runId })).toBe('FAILED');
  });
});
