import { expect, test } from '../../fixtures/run-details';
import { RunDetailsPage } from '../../pages/run-details.page';

test.describe('Run details and retry', { tag: ['@feature:run-details'] }, () => {
  test.describe.configure({ timeout: 120_000 });
  test.use({ viewport: { width: 1280, height: 1000 } });

  test('open a failed run and read the input, output and error of each step', async ({ page, runDetails }) => {
    const run = await runDetails.seedRun({ secret: BROKEN_SECRET });
    expect(run.status).toBe('FAILED');
    const runPage = new RunDetailsPage(page);

    await runPage.open(run.runId);
    await runPage.expectRunStatus('Run Failed');

    await runPage.openStep('step_1');
    await runPage.expectStepOutput({ key: 'token', value: run.token });

    await runPage.openStepInput('step_2');
    await runPage.expectStepInput({ key: 'content', value: run.token });

    await runPage.openStep('step_3');
    await runPage.expectStepError(CONNECTION_ERROR);
  });

  test('download a file from a step output', async ({ page, runDetails }) => {
    const run = await runDetails.seedRun({ secret: BROKEN_SECRET });
    const runPage = new RunDetailsPage(page);

    await runPage.open(run.runId);
    await runPage.openStep('step_2');

    expect(await runPage.downloadStepFile()).toBe(run.token);
  });

  test('fix a connection and retry the run from the failed step', async ({ page, runDetails }) => {
    const run = await runDetails.seedRun({ secret: BROKEN_SECRET });
    const runPage = new RunDetailsPage(page);
    await runPage.open(run.runId);
    await runPage.expectRunStatus('Run Failed');

    await runDetails.publishFix({ flowId: run.flowId });
    await runDetails.fixConnection({ connection: run.connection });
    const retriedRunId = await runPage.retry('From failed step');

    expect(retriedRunId).toBe(run.runId);
    await runPage.expectRunStatus('Run Succeeded');
    await runPage.openStep('step_3');
    await runPage.expectStepOutput({ key: 'version', value: 'v1' });
    await runPage.openStep('step_1');
    await runPage.expectStepOutput({ key: 'token', value: run.token });
  });

  test('fix the flow and retry the run on the latest version', async ({ page, runDetails }) => {
    const run = await runDetails.seedRun({ secret: BROKEN_SECRET });
    const runPage = new RunDetailsPage(page);
    await runPage.open(run.runId);
    await runPage.expectRunStatus('Run Failed');

    await runDetails.publishFix({ flowId: run.flowId });
    const retriedRunId = await runPage.retry('On latest version');

    expect(retriedRunId).not.toBe(run.runId);
    await runPage.expectRunStatus('Run Succeeded');
    await runPage.openStep('step_3');
    await runPage.expectStepOutput({ key: 'version', value: 'v2' });
    expect(await runDetails.readRunStatus({ runId: run.runId })).toBe('FAILED');
  });

  test('a retry from the failed step of a succeeded run is refused', async ({ runDetails }) => {
    const run = await runDetails.seedRun({ secret: FIXED_SECRET });
    expect(run.status).toBe('SUCCEEDED');

    expect(await runDetails.retryStatus({ runId: run.runId, strategy: 'FROM_FAILED_STEP' })).toBe(409);
    expect(await runDetails.readRunStatus({ runId: run.runId })).toBe('SUCCEEDED');
  });
});

const BROKEN_SECRET = 'broken';
const FIXED_SECRET = 'fixed';
const CONNECTION_ERROR = 'The connection is not fixed';
