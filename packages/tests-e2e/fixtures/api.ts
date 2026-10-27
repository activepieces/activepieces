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
  const response = await request.delete(`/api/v1/flows/${flowId}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Deleting flow ${flowId} failed with ${response.status()}: ${await response.text()}`);
  }
}

async function deleteStaleFlows({ request, session }: { request: APIRequestContext; session: E2eSession }) {
  const staleFlows = await listStaleFlows({ request, session, cursor: undefined });
  for (const flow of staleFlows) {
    await deleteFlow({ request, session, flowId: flow.id });
  }
  return staleFlows.length;
}

async function listStaleFlows({ request, session, cursor }: { request: APIRequestContext; session: E2eSession; cursor: string | undefined }): Promise<FlowSummary[]> {
  const response = await request.get('/api/v1/flows', {
    headers: { Authorization: `Bearer ${session.token}` },
    params: { projectId: session.projectId, limit: 100, ...(cursor ? { cursor } : {}) },
  });
  if (!response.ok()) {
    throw new Error(`Listing flows failed with ${response.status()}: ${await response.text()}`);
  }
  const page: { data: FlowSummary[]; next: string | null } = await response.json();
  const cutoff = Date.now() - STALE_AFTER_MS;
  const stale = page.data.filter(
    (flow) => flow.version.displayName.startsWith(E2E_FLOW_PREFIX) && Date.parse(flow.created) < cutoff,
  );
  const rest = page.next ? await listStaleFlows({ request, session, cursor: page.next }) : [];
  return [...stale, ...rest];
}

const STALE_AFTER_MS = 60 * 60 * 1000;

export const STORAGE_STATE = path.join(__dirname, '..', '.auth', 'user.json');
export const E2E_FLOW_PREFIX = 'E2E ';
export const e2eApi = { readSession, deleteFlow, deleteStaleFlows };

export type E2eSession = { token: string; projectId: string };

type FlowSummary = { id: string; created: string; version: { displayName: string } };
type StorageState = { origins: { localStorage: { name: string; value: string }[] }[] };
