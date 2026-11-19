import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, SeededConnection, SeededFlow } from './api';
import { test as base } from './index';
import runDetailsTemplate from './templates/run-details.json';

export const test = base.extend<{ runDetails: RunDetails }>({
  runDetails: async ({ request, session, seed }, use) => {
    await use({
      seedRun: async ({ secret }) => {
        const connection = await seed.secretTextConnection({ pieceName: CONNECTION_PIECE, secret });
        const flow = await seed.flow({ template: withConnection(connection.externalId), publish: true });
        const response = await request.post(flow.webhookUrl);
        expect(response.ok(), `Calling the webhook failed with ${response.status()}: ${await response.text()}`).toBe(true);
        const runId = await waitForFinishedRun({ request, session, flowId: flow.flowId });
        const run = await readRun({ request, session, runId });
        return { ...flow, connection, runId, status: run.status, token: run.steps.step_1.output.token };
      },
      fixConnection: async ({ connection }) => {
        await e2eApi.callApi({
          request,
          session,
          method: 'POST',
          path: '/api/v1/app-connections',
          data: {
            externalId: connection.externalId,
            displayName: connection.displayName,
            pieceName: CONNECTION_PIECE,
            projectId: session.projectId,
            type: 'SECRET_TEXT',
            value: { type: 'SECRET_TEXT', secret_text: FIXED_SECRET },
          },
        });
      },
      publishFix: async ({ flowId }) => {
        await e2eApi.callApi({ request, session, method: 'POST', path: `/api/v1/flows/${flowId}`, data: { type: 'UPDATE_ACTION', request: fixedCheckStep() } });
        await e2eApi.callApi({ request, session, method: 'POST', path: `/api/v1/flows/${flowId}`, data: { type: 'LOCK_AND_PUBLISH', request: {} } });
      },
      readRunStatus: async ({ runId }) => (await readRun({ request, session, runId })).status,
      retryStatus: ({ runId, strategy }) => e2eApi.callApiStatus({
        request,
        session,
        method: 'POST',
        path: `/api/v1/flow-runs/${runId}/retry`,
        data: { strategy, projectId: session.projectId },
      }),
    });
  },
});

export { expect } from '@playwright/test';

function withConnection(externalId: string) {
  return JSON.parse(JSON.stringify(runDetailsTemplate).replaceAll(CONNECTION_PLACEHOLDER, externalId));
}

function fixedCheckStep() {
  const step = runDetailsTemplate.flows[0].trigger.nextAction.nextAction.nextAction;
  const { lastUpdatedDate: _lastUpdatedDate, ...rest } = step;
  return { ...rest, settings: { ...rest.settings, input: {}, sourceCode: { ...rest.settings.sourceCode, code: FIXED_CODE } } };
}

async function waitForFinishedRun({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }): Promise<string> {
  const findRun = async () => {
    const page = await e2eApi.callApi<{ data: { id: string; status: string }[] }>({
      request,
      session,
      method: 'GET',
      path: '/api/v1/flow-runs',
      params: { projectId: session.projectId, flowId, limit: '1' },
    });
    return page.data[0];
  };
  await expect.poll(async () => (await findRun())?.status, { message: `a finished run of flow ${flowId}`, timeout: RUN_TIMEOUT_MS })
    .toMatch(FINISHED_STATUS);
  const run = await findRun();
  return run.id;
}

async function readRun({ request, session, runId }: { request: APIRequestContext; session: E2eSession; runId: string }) {
  return e2eApi.callApi<{ status: string; steps: { step_1: { output: { token: string } } } }>({
    request,
    session,
    method: 'GET',
    path: `/api/v1/flow-runs/${runId}`,
  });
}

const CONNECTION_PIECE = '@activepieces/piece-webhook';
const CONNECTION_PLACEHOLDER = 'CONNECTION_EXTERNAL_ID';
const FIXED_SECRET = 'fixed';
const FIXED_CODE = 'export const code = async () => {\n  return { version: \'v2\' };\n};';
const FINISHED_STATUS = /^(SUCCEEDED|FAILED)$/;
const RUN_TIMEOUT_MS = 60_000;

type SeededRun = SeededFlow & { connection: SeededConnection; runId: string; status: string; token: string };

type RunDetails = {
  seedRun: (params: { secret: string }) => Promise<SeededRun>;
  fixConnection: (params: { connection: SeededConnection }) => Promise<void>;
  publishFix: (params: { flowId: string }) => Promise<void>;
  readRunStatus: (params: { runId: string }) => Promise<string>;
  retryStatus: (params: { runId: string; strategy: 'FROM_FAILED_STEP' | 'ON_LATEST_VERSION' }) => Promise<number>;
};
