import '../src';
import { expect, vi } from 'vitest';
import { AppConnectionType, AppConnectionValueForAuthProperty, TriggerStrategy } from '@activepieces/pieces-framework';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { todoistAuth } from '../src';
import { todoistTaskCompletedTrigger } from '../src/lib/triggers/task-completed-trigger';
import { TodoistCompletedTask } from '../src/lib/common/models';

const ENDPOINT_PATH = '/api/v1/tasks/completed/by_completion_date';
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const START = Date.UTC(2026, 10, 1, 10, 0, 0);

const vendor: VendorState = freshVendor();
let clock = START;

function freshVendor(): VendorState {
  return {
    tasks: [],
    requests: [],
    calls: 0,
    fail: false,
    failOnCall: null,
    requestCostMs: 0,
    staleCursorOnce: false,
    cursorTtlMs: Number.POSITIVE_INFINITY,
    rawItems: null,
    rawNextCursor: null,
  };
}

function reset({ at }: { at?: number } = {}): void {
  Object.assign(vendor, freshVendor());
  vi.useFakeTimers({ toFake: ['Date'] });
  setClock(at ?? START);
  vi.stubGlobal('fetch', vi.fn(handleRequest));
}

function restore(): void {
  process.env.TZ = 'UTC';
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}

function setClock(ms: number): void {
  clock = ms;
  vi.setSystemTime(clock);
}

function advance(minutes = 5): void {
  setClock(clock + minutes * MINUTE);
}

function now(): number {
  return clock;
}

function iso(ms: number): string {
  return new Date(ms).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z');
}

function task({ id, completedAt }: { id: string; completedAt: string }): TodoistCompletedTask {
  return {
    id,
    user_id: '2671355',
    project_id: '6XGgm6PHrGgMpCFX',
    section_id: null,
    parent_id: null,
    added_by_uid: '2671355',
    assigned_by_uid: null,
    responsible_uid: null,
    completed_by_uid: '2671355',
    labels: [],
    checked: true,
    is_deleted: false,
    content: `Task ${id}`,
    description: '',
    priority: 1,
    note_count: 0,
    due: null,
    added_at: '2026-01-01T00:00:00.000000Z',
    completed_at: completedAt,
    updated_at: completedAt,
  };
}

function complete({ id, at, visibleFrom }: { id: string; at?: number; visibleFrom?: number }): void {
  vendor.tasks.push({
    task: task({ id, completedAt: iso(at ?? clock - 1000) }),
    visibleFrom: visibleFrom ?? clock,
  });
}

function json({ body, status = 200 }: { body: unknown; status?: number }): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function strictUtc(value: string | null): number {
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  return Date.parse(String(value));
}

async function handleRequest(input: string | URL | Request): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : String(input));
  expect(url.origin).toBe('https://api.todoist.com');
  expect(url.pathname).toBe(ENDPOINT_PATH);
  vendor.calls += 1;
  const params = Object.fromEntries(url.searchParams.entries());
  vendor.requests.push(params);
  if (vendor.requestCostMs > 0) {
    setClock(clock + vendor.requestCostMs);
  }
  if (vendor.fail) {
    return json({ body: 'Todoist 503', status: 503 });
  }
  if (vendor.failOnCall === vendor.calls) {
    return json({ body: `Todoist failure on call ${vendor.calls}`, status: 503 });
  }
  const cursor = params['cursor'];
  if (cursor && clock - Number(cursor.split('.')[0]) > vendor.cursorTtlMs) {
    return json({ body: 'cursor expired', status: 410 });
  }
  if (cursor && vendor.staleCursorOnce) {
    vendor.staleCursorOnce = false;
    return json({ body: 'invalid cursor', status: 400 });
  }
  if (vendor.rawItems !== null) {
    return json({ body: { items: vendor.rawItems, next_cursor: vendor.rawNextCursor } });
  }
  const since = strictUtc(url.searchParams.get('since'));
  const until = strictUtc(url.searchParams.get('until'));
  expect(until - since).toBeLessThanOrEqual(92 * DAY);
  const limit = Math.min(Number(params['limit'] ?? 50), 200);
  const offset = cursor ? Number(cursor.split('.')[1]) : 0;
  const matching = vendor.tasks
    .filter(({ task: item, visibleFrom }) => {
      const completed = Date.parse(item.completed_at);
      return visibleFrom <= clock && completed >= since && completed < until;
    })
    .map(({ task: item }) => item)
    .sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at));
  const items = matching.slice(offset, offset + limit);
  const next = offset + limit < matching.length ? `${clock}.${offset + limit}` : null;
  return json({ body: { items, next_cursor: next } });
}

function memoryStore(initial: Record<string, unknown> = {}): MemoryStore {
  const data = new Map<string, string>(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  const puts: string[] = [];
  return {
    puts,
    raw: (key: string): unknown => {
      const value = data.get(key);
      return value === undefined ? null : JSON.parse(value);
    },
    put: async <T>(key: string, value: T): Promise<T> => {
      puts.push(key);
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const value = data.get(key);
      return value === undefined ? null : JSON.parse(value);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

const auth: AppConnectionValueForAuthProperty<typeof todoistAuth> = {
  type: AppConnectionType.OAUTH2,
  access_token: 'token',
  refresh_token: 'refresh',
  token_type: 'Bearer',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com/redirect',
  claimed_at: 0,
  scope: 'data:read',
  token_url: 'https://todoist.com/oauth/access_token',
  props: {},
  data: {},
};

function pollingTrigger() {
  if (todoistTaskCompletedTrigger.type !== TriggerStrategy.POLLING) {
    throw new Error('expected a polling trigger');
  }
  return todoistTaskCompletedTrigger;
}

function ctx({ store, isRepublish, projectId }: { store: MemoryStore; isRepublish?: boolean; projectId?: string }) {
  return {
    ...createMockPollingTriggerContext<typeof todoistTaskCompletedTrigger.props>({ propsValue: { project_id: projectId } }),
    store,
    auth,
    isRepublish,
    files: createMockActionContext({ propsValue: {} }).files,
  };
}

function field({ value, key }: { value: unknown; key: string }): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }
  return Object.entries(value).find(([name]) => name === key)?.[1];
}

function ids(events: unknown[]): string[] {
  return events.map((event) => String(field({ value: event, key: 'id' })));
}

function stateField({ store, key }: { store: MemoryStore; key: string }): unknown {
  return field({ value: store.raw('taskCompletedState'), key });
}

export const todoistFake = {
  MINUTE,
  DAY,
  vendor,
  trigger: pollingTrigger(),
  reset,
  restore,
  setClock,
  advance,
  now,
  iso,
  task,
  complete,
  memoryStore,
  ctx,
  field,
  ids,
  stateField,
};

type VendorState = {
  tasks: { task: TodoistCompletedTask; visibleFrom: number }[];
  requests: Record<string, string>[];
  calls: number;
  fail: boolean;
  failOnCall: number | null;
  requestCostMs: number;
  staleCursorOnce: boolean;
  cursorTtlMs: number;
  rawItems: unknown[] | null;
  rawNextCursor: string | null;
};

type MemoryStore = {
  puts: string[];
  raw: (key: string) => unknown;
  put: <T>(key: string, value: T) => Promise<T>;
  get: <T>(key: string) => Promise<T | null>;
  delete: (key: string) => Promise<void>;
};
