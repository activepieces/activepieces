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
export const e2eApi = { readSession, deleteFlow, deleteConnection, deleteStaleData };

export type E2eSession = { token: string; projectId: string };

type Resource = 'flows' | 'app-connections';
type FlowSummary = { id: string; created: string; version: { displayName: string } };
type ConnectionSummary = { id: string; created: string; displayName: string };
type StorageState = { origins: { localStorage: { name: string; value: string }[] }[] };
