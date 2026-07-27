import { HttpMethod } from '@activepieces/pieces-common';
import type { PolotnoClient } from './client';
import { MAX_MAX_WAIT_SECONDS, isTerminal } from './constants';
import { pollUntilTerminal } from './poll';
import { isPubliclyReachable } from './reachability';
import type { RenderKind, RenderLike } from './types';

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

/**
 * Start a render and decide how to wait for it.
 *
 * Preferred path: park the run on a WEBHOOK waitpoint and let the API's per-render
 * callback resume it. When the resume URL is not publicly reachable the API would
 * refuse to deliver and the run would sit paused until AP_PAUSED_FLOW_TIMEOUT_DAYS,
 * so we poll inline instead.
 */
export async function executeRender(params: ExecuteRenderParams): Promise<Record<string, unknown>> {
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
    // A fresh render always responds `pending`, so a terminal status here means
    // an Idempotency-Key replay of a render that already finished. That fires no
    // new event, so parking would wait forever for a callback that already
    // happened. Return instead — the created waitpoint is simply never used.
    if (!isTerminal(render.status)) {
      params.waitForWaitpoint(waitpoint.id);
    }
    return { ...render, timed_out: false };
  }

  // Images can be waited on server-side for up to 30 s; videos have no sync mode.
  const queryParams = params.kind === 'images' ? { sync: 'true' } : undefined;
  const render = await params.client.request<RenderLike>({
    method: HttpMethod.POST,
    path: `/v1/${params.kind}`,
    body: params.body,
    headers,
    ...(queryParams === undefined ? {} : { queryParams }),
  });

  if (isTerminal(render.status)) {
    return { ...render, timed_out: false };
  }

  const result = await pollUntilTerminal({
    client: params.client,
    kind: params.kind,
    id: render.id,
    maxWaitMs: Math.min(params.maxWaitSeconds, MAX_MAX_WAIT_SECONDS) * 1_000,
    ...(params.sleep === undefined ? {} : { sleep: params.sleep }),
    ...(params.now === undefined ? {} : { now: params.now }),
  });
  return { ...result.render, timed_out: result.timedOut };
}

/** Read the render out of the per-render webhook envelope that resumed this run. */
export function readResumedRender(resumePayload: { body: unknown }): Record<string, unknown> {
  const body = resumePayload.body as { data?: { object?: RenderLike } } | undefined;
  const object = body?.data?.object;
  if (!object || typeof object !== 'object' || typeof object.id !== 'string') {
    throw new Error(
      'Polotno Studio sent an unrecognised callback, so this render could not be read. Check the render in the Polotno Studio dashboard.',
    );
  }
  return { ...object, timed_out: false };
}
