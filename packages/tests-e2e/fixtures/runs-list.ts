import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, SeededFlow } from './api';
import { test as base } from './index';
import webhookFail from './templates/webhook-fail.json';

export const test = base.extend<{ runsList: RunsList }>({
  runsList: async ({ request, session, seed }, use) => {
    await use({
      newPrefix: () => `runs ${randomUUID().slice(0, 8)}`,
      seedFailedRuns: async ({ prefix, count, session: projectSession }) => {
        const flowSession = projectSession ?? session;
        const flow = await seed.flow({ template: webhookFail, publish: true, session: flowSession });
        await Promise.all(Array.from({ length: count }, () => callWebhook({ request, url: flow.webhookUrl, value: prefix })));
        const runIds = await waitForRuns({ request, session: flowSession, flowId: flow.flowId, status: 'FAILED', count });
        return { ...flow, runIds };
      },
      publishFix: async ({ flowId }) => {
        await e2eApi.callApi({ request, session, method: 'POST', path: `/api/v1/flows/${flowId}`, data: { type: 'UPDATE_ACTION', request: fixedStep() } });
        await e2eApi.callApi({ request, session, method: 'POST', path: `/api/v1/flows/${flowId}`, data: { type: 'LOCK_AND_PUBLISH', request: {} } });
      },
      readRunStatus: async ({ runId }) => {
        const path = `/api/v1/flow-runs/${runId}`;
        if (await e2eApi.callApiStatus({ request, session, method: 'GET', path }) === 404) {
          return NOT_CREATED;
        }
        const run = await e2eApi.callApi<{ status: string }>({ request, session, method: 'GET', path });
        return run.status;
      },
    });
  },
});

export { expect } from '@playwright/test';

async function callWebhook({ request, url, value }: { request: APIRequestContext; url: string; value: string }) {
  const response = await request.post(url, { params: { value } });
  if (!response.ok()) {
    throw new Error(`Calling the webhook ${url} failed with ${response.status()}: ${await response.text()}`);
  }
}

async function waitForRuns({ request, session, flowId, status, count }: {
  request: APIRequestContext;
  session: E2eSession;
  flowId: string;
  status: string;
  count: number;
}): Promise<string[]> {
  const listRuns = async () => {
    const page = await e2eApi.callApi<{ data: { id: string }[] }>({
      request,
      session,
      method: 'GET',
      path: '/api/v1/flow-runs',
      params: { projectId: session.projectId, flowId, status, limit: String(count + 1) },
    });
    return page.data.map((run) => run.id);
  };
  await expect.poll(async () => (await listRuns()).length, { message: `${count} ${status} runs of flow ${flowId}`, timeout: RUNS_TIMEOUT_MS }).toBe(count);
  return listRuns();
}

function fixedStep() {
  const [{ trigger }] = webhookFail.flows;
  const { lastUpdatedDate: _lastUpdatedDate, ...step } = trigger.nextAction;
  return { ...step, settings: { ...step.settings, sourceCode: { ...step.settings.sourceCode, code: FIXED_CODE } } };
}

const FIXED_CODE = 'export const code = async (inputs) => {\n  return inputs.message;\n};';
const RUNS_TIMEOUT_MS = 60_000;
const NOT_CREATED = 'NOT_CREATED';

type RunsList = {
  newPrefix: () => string;
  seedFailedRuns: (params: { prefix: string; count: number; session?: E2eSession }) => Promise<SeededFlow & { runIds: string[] }>;
  publishFix: (params: { flowId: string }) => Promise<void>;
  readRunStatus: (params: { runId: string }) => Promise<string>;
};
