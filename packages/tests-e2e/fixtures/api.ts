import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRequestContext } from '@playwright/test';

function readSession(): E2eSession {
  const state: StorageState = JSON.parse(readFileSync(STORAGE_STATE, 'utf-8'));
  const entries = state.origins.flatMap((origin) => origin.localStorage);
  const token = entries.find((entry) => entry.name === 'token')?.value;
  const projectId = entries.find((entry) => entry.name === 'projectId')?.value;
  if (!token || !projectId) {
    throw new Error(`${STORAGE_STATE} holds no token or projectId: global setup did not finish signing in`);
  }
  return { token, projectId };
}

async function deleteFlow({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  await deleteById({ request, session, resource: 'flows', id: flowId });
}

async function deleteConnection({ request, session, connectionId }: { request: APIRequestContext; session: E2eSession; connectionId: string }) {
  await deleteById({ request, session, resource: 'app-connections', id: connectionId });
}

async function deleteStaleData({ request, session }: { request: APIRequestContext; session: E2eSession }) {
  const staleFlows = await listStale({ request, session, resource: 'flows', nameOf: (flow: FlowSummary) => flow.version.displayName, cursor: undefined });
  for (const flow of staleFlows) {
    await deleteFlow({ request, session, flowId: flow.id });
  }
  const staleConnections = await listStale({ request, session, resource: 'app-connections', nameOf: (connection: ConnectionSummary) => connection.displayName, cursor: undefined });
  for (const connection of staleConnections) {
    await deleteConnection({ request, session, connectionId: connection.id });
  }
  return { flows: staleFlows.length, connections: staleConnections.length };
}

async function describeFlow({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  const flow = await readJson<FlowState>({ request, session, path: `/api/v1/flows/${flowId}`, params: {} });
  const runs = await readJson<{ data: RunSummary[] }>({
    request,
    session,
    path: '/api/v1/flow-runs',
    params: { projectId: session.projectId, flowId, limit: 5 },
  });
  const flowLine = 'error' in flow
    ? flow.error
    : JSON.stringify({
      status: flow.body.status,
      operationStatus: flow.body.operationStatus,
      publishedVersionId: flow.body.publishedVersionId,
      versionState: flow.body.version.state,
      trigger: flow.body.version.trigger.settings.triggerName,
      triggerInput: flow.body.version.trigger.settings.input,
    });
  const runsLine = 'error' in runs
    ? runs.error
    : JSON.stringify(runs.body.data.map(({ status, environment, created }) => ({ status, environment, created })));
  return redact({ session, text: `flow: ${flowLine}\nruns: ${runsLine}` });
}

async function describeRun({ request, session, runId }: { request: APIRequestContext; session: E2eSession; runId: string }) {
  const run = await readJson<RunDetails>({ request, session, path: `/api/v1/flow-runs/${runId}`, params: {} });
  if ('error' in run) {
    return redact({ session, text: run.error });
  }
  const failedSteps = Object.entries(run.body.steps ?? {})
    .filter(([, step]) => step.status === 'FAILED')
    .map(([name, step]) => `${name}: ${(step.errorMessage ?? 'no error message').slice(0, 500)}`);
  return redact({ session, text: [`run ${run.body.status}`, ...failedSteps].join('; ') });
}

async function readJson<T>({ request, session, path, params }: {
  request: APIRequestContext;
  session: E2eSession;
  path: string;
  params: Record<string, string | number>;
}): Promise<{ body: T } | { error: string }> {
  const response = await request
    .get(path, { headers: { Authorization: `Bearer ${session.token}` }, params })
    .catch((error: unknown) => new Error(String(error)));
  if (response instanceof Error) {
    return { error: `GET ${path} failed: ${response.message}` };
  }
  if (!response.ok()) {
    return { error: `GET ${path} returned ${response.status()}` };
  }
  return { body: await response.json() };
}

function redact({ session, text }: { session: E2eSession; text: string }) {
  return text.replaceAll(session.token, '***');
}

async function deleteById({ request, session, resource, id }: { request: APIRequestContext; session: E2eSession; resource: Resource; id: string }) {
  const response = await request.delete(`/api/v1/${resource}/${id}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Deleting ${resource} ${id} failed with ${response.status()}: ${await response.text()}`);
  }
}

async function listStale<T extends { id: string; created: string }>({ request, session, resource, nameOf, cursor }: {
  request: APIRequestContext;
  session: E2eSession;
  resource: Resource;
  nameOf: (item: T) => string;
  cursor: string | undefined;
}): Promise<T[]> {
  const response = await request.get(`/api/v1/${resource}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    params: { projectId: session.projectId, limit: 100, ...(cursor ? { cursor } : {}) },
  });
  if (!response.ok()) {
    throw new Error(`Listing ${resource} failed with ${response.status()}: ${await response.text()}`);
  }
  const page: { data: T[]; next: string | null } = await response.json();
  const cutoff = Date.now() - STALE_AFTER_MS;
  const stale = page.data.filter((item) => nameOf(item).startsWith(E2E_PREFIX) && Date.parse(item.created) < cutoff);
  const rest = page.next ? await listStale({ request, session, resource, nameOf, cursor: page.next }) : [];
  return [...stale, ...rest];
}

const STALE_AFTER_MS = 60 * 60 * 1000;

export const STORAGE_STATE = path.join(__dirname, '..', '.auth', 'user.json');
export const E2E_PREFIX = 'E2E ';
export const e2eApi = { readSession, deleteFlow, deleteConnection, deleteStaleData, describeFlow, describeRun };

export type E2eSession = { token: string; projectId: string };

type Resource = 'flows' | 'app-connections';
type FlowSummary = { id: string; created: string; version: { displayName: string } };
type ConnectionSummary = { id: string; created: string; displayName: string };
type FlowState = {
  status: string;
  operationStatus: string;
  publishedVersionId: string | null;
  version: { state: string; trigger: { settings: { triggerName?: string; input?: unknown } } };
};
type RunSummary = { status: string; environment: string; created: string };
type RunDetails = { status: string; steps?: Record<string, { status: string; errorMessage?: string }> };
type StorageState = { origins: { localStorage: { name: string; value: string }[] }[] };
