import { HttpMethod } from '@activepieces/pieces-common';
import type { PolotnoClient } from './client';
import { polotnoConstants } from './constants';
import { readEventEnvelopeObject } from './event-envelope';
import { pollUntilTerminal } from './poll';
import { isPubliclyReachable } from './reachability';
import type { RenderKind, RenderLike } from './types';

async function executeRender(params: ExecuteRenderParams): Promise<Record<string, unknown>> {
  const headers = { 'Idempotency-Key': params.idempotencyKey };

  if (!params.waitForCompletion) {
    const render = await params.client.request<RenderLike>({
      method: HttpMethod.POST,
      path: `/v1/${params.kind}`,
      body: params.body,
      headers,
    });
    return { ...render, timed_out: false };
  }

  const waitpoint = await params.createWaitpoint({ type: 'WEBHOOK' });
  const resumeUrl = waitpoint.buildResumeUrl({ queryParams: {} });

  if (isPubliclyReachable(resumeUrl)) {
    const render = await params.client.request<RenderLike>({
      method: HttpMethod.POST,
      path: `/v1/${params.kind}`,
      body: { ...params.body, webhook_url: resumeUrl },
      headers,
    });
    if (!polotnoConstants.isTerminal(render.status)) {
      params.waitForWaitpoint(waitpoint.id);
    }
    return { ...render, timed_out: false };
  }

  const queryParams = params.kind === 'images' ? { sync: 'true' } : undefined;
  const render = await params.client.request<RenderLike>({
    method: HttpMethod.POST,
    path: `/v1/${params.kind}`,
    body: params.body,
    headers,
    ...(queryParams === undefined ? {} : { queryParams }),
  });

  if (polotnoConstants.isTerminal(render.status)) {
    return { ...render, timed_out: false };
  }

  const result = await pollUntilTerminal({
    client: params.client,
    kind: params.kind,
    id: render.id,
    maxWaitMs: Math.min(params.maxWaitSeconds, polotnoConstants.MAX_MAX_WAIT_SECONDS) * 1_000,
    ...(params.sleep === undefined ? {} : { sleep: params.sleep }),
    ...(params.now === undefined ? {} : { now: params.now }),
  });
  return { ...result.render, timed_out: result.timedOut };
}

function readResumedRender(resumePayload: { body: unknown }): Record<string, unknown> {
  const object = readEventEnvelopeObject(resumePayload.body);
  if (!object) {
    throw new Error(
      'Polotno Studio sent an unrecognised callback, so this render could not be read. Check the render in the Polotno Studio dashboard.',
    );
  }
  return { ...object, timed_out: false };
}

export const renderFlow = { executeRender, readResumedRender };

export interface Waitpoint {
  id: string;
  buildResumeUrl: (params: { queryParams: Record<string, string>; sync?: boolean }) => string;
}

export interface ExecuteRenderParams {
  client: PolotnoClient;
  kind: RenderKind;
  body: Record<string, unknown>;
  idempotencyKey: string;
  waitForCompletion: boolean;
  maxWaitSeconds: number;
  createWaitpoint: (params: { type: 'WEBHOOK' }) => Promise<Waitpoint>;
  waitForWaitpoint: (waitpointId: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}
