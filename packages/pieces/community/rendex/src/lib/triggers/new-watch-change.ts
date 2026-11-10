import { createTrigger, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { rendexAuth } from '../common/auth';
import { rendexClient, RendexAuthValue } from '../common/client';
import { rendexInput } from '../common/common';
import { rendexProps } from '../common/props';
import { newWatchChangeOutputSchema } from '../common/output-schemas';

const FIRE_ON_OPTIONS = [
  { label: 'The page changed', value: 'changed' },
  { label: 'Any finished check', value: 'completed' },
  { label: 'A check failed', value: 'failed' },
];

const PAGE_SIZE = 100;
const TEST_PAGE_SIZE = 10;
const MAX_PAGES = 20;
const LOOKBACK_MS = 5 * 60 * 1000;
const MAX_SEEN_IDS = MAX_PAGES * PAGE_SIZE;
const UNFINISHED_HOLD_MS = 60 * 60 * 1000;
const STATE_KEY = 'rendex_watch_poll_state';

async function poll({ auth, store, propsValue }: { auth: RendexAuthValue; store: Store; propsValue: { watch_id: unknown; fire_on: unknown } }): Promise<Record<string, unknown>[]> {
  const watchId = rendexClient.segment({ value: propsValue.watch_id, label: 'Watch' });
  const fireOn = fireOnOf(propsValue.fire_on);
  const state = stateOf(await store.get<unknown>(STATE_KEY));
  if (state === null) {
    await store.put(STATE_KEY, freshState());
    return [];
  }
  const runs = await runsSince({ auth, watchId, sinceEpochMS: state.scannedThrough - LOOKBACK_MS });
  const seen = new Set(state.seen);
  const finished = runs.filter(isFinished);
  const fresh = finished.filter((run) => !seen.has(String(run['id'])) && epochOf(run) > state.since && matches({ run, fireOn }));
  const events = await withWatch({ auth, watchId, runs: fresh });
  const next: PollState = {
    since: state.since,
    scannedThrough: nextMarker({ runs, previous: state.scannedThrough }),
    seen: [...new Set([...finished.map((run) => String(run['id'])), ...state.seen])].slice(0, MAX_SEEN_IDS),
  };
  await store.put(STATE_KEY, next);
  return events;
}

async function sample({ auth, propsValue }: { auth: RendexAuthValue; propsValue: { watch_id: unknown; fire_on: unknown } }): Promise<Record<string, unknown>[]> {
  const watchId = rendexClient.segment({ value: propsValue.watch_id, label: 'Watch' });
  const fireOn = fireOnOf(propsValue.fire_on);
  const runs = (await firstPage({ auth, watchId })).filter((run) => matches({ run, fireOn }));
  return withWatch({ auth, watchId, runs });
}

function fireOnOf(value: unknown): string {
  return rendexInput.choiceOf({ value, label: 'Fire When', allowed: FIRE_ON_OPTIONS.map((option) => option.value) }) ?? 'changed';
}

function freshState(): PollState {
  const now = Date.now();
  return { since: now, scannedThrough: now, seen: [] };
}

function stateOf(value: unknown): PollState | null {
  if (typeof value !== 'object' || value === null) return null;
  const since = Reflect.get(value, 'since');
  const scannedThrough = Reflect.get(value, 'scannedThrough');
  const seen = Reflect.get(value, 'seen');
  if (typeof since !== 'number' || typeof scannedThrough !== 'number' || !Array.isArray(seen)) return null;
  return { since, scannedThrough, seen: seen.map(String) };
}

async function withWatch({ auth, watchId, runs }: { auth: RendexAuthValue; watchId: string; runs: Record<string, unknown>[] }): Promise<Record<string, unknown>[]> {
  if (runs.length === 0) {
    return [];
  }
  const watch = await rendexClient.requestData({
    auth,
    method: HttpMethod.GET,
    path: `/v1/watches/${watchId}`,
    operation: 'get the watch',
  });
  return runs.map((run) => ({ ...run, watch: { id: watch['id'] ?? null, url: watch['url'] ?? null, name: watch['name'] ?? null } }));
}

function nextMarker({ runs, previous }: { runs: Record<string, unknown>[]; previous: number }): number {
  const created = runs.map(createdEpochOf).filter((time) => time > 0);
  const newest = created.reduce((max, time) => (time > max ? time : max), previous);
  const unfinished = runs
    .filter((run) => !isFinished(run))
    .map(createdEpochOf)
    .filter((time) => time > 0 && time > newest - UNFINISHED_HOLD_MS);
  const oldestUnfinished = unfinished.reduce((min, time) => (time < min ? time : min), Number.POSITIVE_INFINITY);
  return Math.max(previous, Math.min(newest, oldestUnfinished));
}

async function firstPage({ auth, watchId }: { auth: RendexAuthValue; watchId: string }): Promise<Record<string, unknown>[]> {
  const page = await rendexClient.listPage({
    auth,
    path: `/v1/watches/${watchId}/runs`,
    query: { limit: TEST_PAGE_SIZE },
    operation: 'list the watch runs',
  });
  return page.items;
}

async function runsSince({ auth, watchId, sinceEpochMS }: { auth: RendexAuthValue; watchId: string; sinceEpochMS: number }): Promise<Record<string, unknown>[]> {
  const pages: Record<string, unknown>[][] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber++) {
    const page = await rendexClient.listPage({
      auth,
      path: `/v1/watches/${watchId}/runs`,
      query: { limit: PAGE_SIZE, cursor },
      operation: 'list the watch runs',
    });
    pages.push(page.items);
    const reachedCheckpoint = page.items.some((run) => createdEpochOf(run) < sinceEpochMS);
    if (reachedCheckpoint || page.nextCursor === null) {
      return pages.flat();
    }
    if (seen.has(page.nextCursor)) {
      throw new Error('Rendex returned the same page cursor twice while listing watch runs.');
    }
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  }
  throw new Error(`More than ${MAX_PAGES * PAGE_SIZE} watch runs were created since the last check, more than one poll can read. No runs were emitted; lower the watch's check frequency or read the history with List Watch Runs.`);
}

function isFinished(run: Record<string, unknown>): boolean {
  return run['status'] === 'completed' || run['status'] === 'failed';
}

function matches({ run, fireOn }: { run: Record<string, unknown>; fireOn: string }): boolean {
  if (fireOn === 'failed') return run['status'] === 'failed';
  if (run['status'] !== 'completed') return false;
  return fireOn === 'completed' || run['changed'] === true;
}

function epochOf(run: Record<string, unknown>): number {
  const completed = timeOf(run['completedAt']);
  return completed ?? createdEpochOf(run);
}

function createdEpochOf(run: Record<string, unknown>): number {
  return timeOf(run['createdAt']) ?? 0;
}

function timeOf(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

export const newWatchChange = createTrigger({
  auth: rendexAuth,
  name: 'new_watch_change',
  classification: 'READ',
  displayName: 'Watch Detected a Change',
  description: 'Triggers when a Rendex watch finishes a check that found a change (or, optionally, any finished or failed check).',
  aiMetadata: {
    description:
      'Fires once per finished check of one Rendex watch: by default only when the page changed, or for every finished check, or only for failed checks. Each event carries the run (changed, diff score, before/after/overlay image links, text changes, error) and the watch id, URL and name. Polls the watch history, so it works on every plan without webhooks.',
  },
  props: {
    watch_id: rendexProps.watchDropdown(),
    fire_on: rendexProps.choice({ displayName: 'Fire When', description: 'Which checks start the flow. Default The page changed.', values: FIRE_ON_OPTIONS }),
  },
  sampleData: {
    id: '54da9598-4cef-44b5-acc1-8e0e51c5fd51',
    watchId: 'a5c2e6ae-6976-482f-82ea-b32e1ac650ab',
    status: 'completed',
    changed: true,
    diffScore: null,
    diffPixels: null,
    beforeUrl: null,
    afterUrl: 'https://api.rendex.dev/v1/images/watch/00000000-0000-4000-8000-000000000000/a5c2e6ae-6976-482f-82ea-b32e1ac650ab/54da9598-4cef-44b5-acc1-8e0e51c5fd51.png?expires=1793948142&sig=0000000000000000000000000000000000000000000000000000000000000000',
    diffOverlayUrl: null,
    cropUrl: null,
    changedRegion: null,
    aiSummary: 'The page text changed — 1 line added, 1 line removed.',
    textDiff: {
      added: ['"uuid": "9282e8bb-d696-47ee-adaa-f25516460699"'],
      removed: ['"uuid": "3396ef5a-cf62-4afd-ab31-600be62a9002"'],
      summary: '+1/-1',
    },
    creditsCharged: 1,
    error: null,
    errorCode: null,
    createdAt: '2026-11-05T06:53:59.54914+00:00',
    completedAt: '2026-11-05T06:54:14.619+00:00',
    watch: { id: 'a5c2e6ae-6976-482f-82ea-b32e1ac650ab', url: 'https://httpbin.org/uuid', name: 'ap-live-test' },
  },
  outputSchema: newWatchChangeOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await sample({ auth: context.auth, propsValue: context.propsValue });
  },
  async onEnable(context) {
    if (context.isRepublish === true && stateOf(await context.store.get<unknown>(STATE_KEY)) !== null) {
      return;
    }
    await context.store.put(STATE_KEY, freshState());
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return await poll({ auth: context.auth, store: context.store, propsValue: context.propsValue });
  },
});

type PollState = { since: number; scannedThrough: number; seen: string[] };
