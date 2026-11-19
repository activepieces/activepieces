import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession } from './api';

async function readFlow({ request, session, flowId }: FlowParams): Promise<FlowState> {
  return e2eApi.callApi<FlowState>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
}

async function draftResponseBody({ request, session, flowId, body }: FlowParams & { body: string }): Promise<void> {
  const { version } = await readFlow({ request, session, flowId });
  const trigger = withResponseBody({ trigger: version.trigger, body });
  await updateFlow({
    request,
    session,
    flowId,
    operation: { type: 'IMPORT_FLOW', request: { displayName: version.displayName, trigger, schemaVersion: version.schemaVersion, notes: null } },
  });
}

async function publishResponseBody({ request, session, flowId, body }: FlowParams & { body: string }): Promise<void> {
  await draftResponseBody({ request, session, flowId, body });
  await publish({ request, session, flowId });
}

async function publish({ request, session, flowId }: FlowParams): Promise<void> {
  await updateFlow({ request, session, flowId, operation: PUBLISH });
}

async function countRuns({ request, session, flowId }: FlowParams): Promise<number> {
  const runs = await e2eApi.callApi<{ data: unknown[] }>({
    request,
    session,
    method: 'GET',
    path: '/api/v1/flow-runs',
    params: { projectId: session.projectId, flowId, limit: '10' },
  });
  return runs.data.length;
}

function responseBodyOf(trigger: EchoTrigger): string {
  return trigger.nextAction.settings.input.fields.body;
}

async function updateFlow({ request, session, flowId, operation }: FlowParams & { operation: unknown }): Promise<void> {
  await e2eApi.callApi({ request, session, method: 'POST', path: `/api/v1/flows/${flowId}`, data: operation });
}

function withResponseBody({ trigger, body }: { trigger: EchoTrigger; body: string }): EchoTrigger {
  const { nextAction } = trigger;
  const { settings } = nextAction;
  return {
    ...trigger,
    nextAction: { ...nextAction, settings: { ...settings, input: { ...settings.input, fields: { ...settings.input.fields, body } } } },
  };
}

export const PUBLISH = { type: 'LOCK_AND_PUBLISH', request: {} };
export const publishVersions = { readFlow, publish, draftResponseBody, publishResponseBody, countRuns, responseBodyOf };

export type FlowState = {
  status: 'ENABLED' | 'DISABLED';
  publishedVersionId: string | null;
  version: { id: string; state: 'DRAFT' | 'LOCKED'; displayName: string; schemaVersion: string | null; trigger: EchoTrigger };
};

type FlowParams = { request: APIRequestContext; session: E2eSession; flowId: string };
type EchoTrigger = Record<string, unknown> & {
  nextAction: Record<string, unknown> & {
    settings: Record<string, unknown> & {
      input: Record<string, unknown> & { fields: Record<string, unknown> & { body: string } };
    };
  };
};
