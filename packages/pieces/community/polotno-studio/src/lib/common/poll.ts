import type { PolotnoClient } from './client';
import { POLL_BACKOFF_FACTOR, POLL_INITIAL_DELAY_MS, POLL_MAX_DELAY_MS, isTerminal } from './constants';
import type { RenderKind, RenderLike } from './types';

export interface PollOptions {
  client: PolotnoClient;
  kind: RenderKind;
  id: string;
  maxWaitMs: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface PollResult {
  render: RenderLike;
  timedOut: boolean;
}

/**
 * Poll a render until it reaches a terminal status or the wait budget expires.
 *
 * Always builds the URL from kind + id: the API's `self_url` is nullable. On
 * timeout this returns the last observed render with `timedOut: true` rather
 * than throwing, so the caller can surface it distinctly from success.
 */
export async function pollUntilTerminal(options: PollOptions): Promise<PollResult> {
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = options.now ?? (() => Date.now());

  const path = `/v1/${options.kind}/${encodeURIComponent(options.id)}`;
  const started = now();
  let delay = POLL_INITIAL_DELAY_MS;

  let render = await options.client.request<RenderLike>({ path });

  while (!isTerminal(render.status)) {
    if (now() - started + delay > options.maxWaitMs) {
      return { render, timedOut: true };
    }
    await sleep(delay);
    delay = Math.min(Math.round(delay * POLL_BACKOFF_FACTOR), POLL_MAX_DELAY_MS);
    render = await options.client.request<RenderLike>({ path });
  }

  return { render, timedOut: false };
}
