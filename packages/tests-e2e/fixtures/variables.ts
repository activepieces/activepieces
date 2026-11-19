import { randomUUID } from 'node:crypto';
import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, FlowTemplate } from './api';
import { test as base } from './index';
import variableEcho from './templates/variable-echo.json';

export const test = base.extend<{ variables: Variables }>({
  variables: async ({ request, session, cleanup }, use) => {
    const seed: Variables['seed'] = async ({ name = uniqueName(), value = uniqueValue(), session: projectSession = session }) => {
      const variable = await e2eApi.callApi<{ id: string }>({
        request,
        session: projectSession,
        method: 'POST',
        path: '/api/v1/variables',
        data: { projectId: projectSession.projectId, name, value },
      });
      cleanup.track({ resource: 'variables', id: variable.id });
      return { id: variable.id, name, value };
    };

    await use({
      uniqueName,
      uniqueValue,
      seed,
      seedMany: async ({ count }) => {
        const word = randomUUID().slice(0, 8);
        const names = Array.from({ length: count }, (_, index) => `E2E_${word}_${String(index + 1).padStart(2, '0')}`);
        await Promise.all(names.map((name) => seed({ name })));
        return { word, names };
      },
      echoTemplate: ({ variableName }) => echoTemplate({ variableName }),
      ownerLabel: async ({ name }) => {
        const [variable] = await listByName({ request, session, name });
        const owner = variable?.owner;
        if (!owner) {
          throw new Error(`The seeded variable ${name} has no owner`);
        }
        return { label: `${owner.firstName} ${owner.lastName} (${owner.email})`, email: owner.email };
      },
      countByName: async ({ name }) => (await listByName({ request, session, name })).filter((variable) => variable.name === name).length,
      reveal: async ({ id }) => {
        const revealed = await e2eApi.callApi<{ value: string }>({ request, session, method: 'POST', path: `/api/v1/variables/${id}/reveal` });
        return revealed.value;
      },
      statusOf: async ({ token, method, path, data, params }) => {
        const response = await request.fetch(path, { method, headers: { Authorization: `Bearer ${token}` }, data, params });
        return response.status();
      },
      seedApiKey: async () => {
        const apiKey = await e2eApi.callApi<{ id: string; value: string }>({
          request,
          session,
          method: 'POST',
          path: '/api/v1/api-keys',
          data: { displayName: e2eApi.uniqueName('variables api key') },
        });
        cleanup.track({ resource: 'api-keys', id: apiKey.id });
        return { token: apiKey.value };
      },
      expectRunReturns: async ({ webhookUrl, value }) => {
        await expect.poll(async () => {
          const response = await request.get(`${webhookUrl}/sync`);
          return { status: response.status(), body: await response.text() };
        }, { timeout: RUN_TIMEOUT_MS, intervals: [1000, 2000, 3000] }).toEqual({ status: 200, body: value });
      },
      expectRunFails: async ({ flowId, webhookUrl, variableName, session: projectSession = session }) => {
        await expect.poll(async () => (await request.get(webhookUrl)).ok(), { timeout: RUN_TIMEOUT_MS }).toBe(true);
        await expect.poll(async () => {
          const run = await readLatestRun({ request, session: projectSession, flowId });
          return { status: run?.status, error: run?.steps?.step_1?.errorMessage ?? null };
        }, { timeout: RUN_TIMEOUT_MS, intervals: [2000, 3000, 5000] }).toEqual({
          status: 'FAILED',
          error: expect.stringContaining(`variable (${variableName}) not found`),
        });
      },
      latestStepInput: async ({ flowId }) => {
        const run = await readLatestRun({ request, session, flowId });
        return run?.steps?.step_1?.input;
      },
    });
  },
});

export { expect } from '@playwright/test';

function uniqueName(): string {
  return `E2E_${randomUUID().slice(0, 8)}`;
}

function uniqueValue(): string {
  return `e2e-value-${randomUUID()}`;
}

function echoTemplate({ variableName }: { variableName: string | null }): FlowTemplate {
  const body = variableName === null ? '' : `{{variables['${variableName}']}}`;
  return JSON.parse(JSON.stringify(variableEcho).replace('"body":""', `"body":${JSON.stringify(body)}`));
}

async function listByName({ request, session, name }: { request: APIRequestContext; session: E2eSession; name: string }): Promise<VariableRow[]> {
  const page = await e2eApi.callApi<{ data: VariableRow[] }>({
    request,
    session,
    method: 'GET',
    path: '/api/v1/variables',
    params: { projectId: session.projectId, name, limit: '100' },
  });
  return page.data;
}

async function readLatestRun({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }): Promise<RunWithSteps | undefined> {
  const runs = await e2eApi.callApi<{ data: { id: string }[] }>({
    request,
    session,
    method: 'GET',
    path: '/api/v1/flow-runs',
    params: { projectId: session.projectId, flowId, limit: '1' },
  });
  const [latest] = runs.data;
  if (latest === undefined) {
    return undefined;
  }
  return e2eApi.callApi<RunWithSteps>({ request, session, method: 'GET', path: `/api/v1/flow-runs/${latest.id}` });
}

const RUN_TIMEOUT_MS = 60_000;

type VariableRow = { id: string; name: string; owner: { email: string; firstName: string; lastName: string } | null };
type RunWithSteps = { status: string; steps?: Record<string, { status: string; input?: unknown; errorMessage?: string }> };
type SeededVariable = { id: string; name: string; value: string };

export type Variables = {
  uniqueName: () => string;
  uniqueValue: () => string;
  seed: (params: { name?: string; value?: string; session?: E2eSession }) => Promise<SeededVariable>;
  seedMany: (params: { count: number }) => Promise<{ word: string; names: string[] }>;
  echoTemplate: (params: { variableName: string | null }) => FlowTemplate;
  ownerLabel: (params: { name: string }) => Promise<{ label: string; email: string }>;
  countByName: (params: { name: string }) => Promise<number>;
  reveal: (params: { id: string }) => Promise<string>;
  statusOf: (params: { token: string; method: 'GET' | 'POST'; path: string; data?: unknown; params?: Record<string, string> }) => Promise<number>;
  seedApiKey: () => Promise<{ token: string }>;
  expectRunReturns: (params: { webhookUrl: string; value: string }) => Promise<void>;
  expectRunFails: (params: { flowId: string; webhookUrl: string; variableName: string; session?: E2eSession }) => Promise<void>;
  latestStepInput: (params: { flowId: string }) => Promise<unknown>;
};
