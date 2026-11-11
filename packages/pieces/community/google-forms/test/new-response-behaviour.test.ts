import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { newResponse } from '../src/lib/triggers/new-form-response';

const vendor: {
  responses: FakeResponse[];
  maxPageSize: number;
  calls: { filter: string | undefined; pageToken: string | undefined; pageSize: string | undefined }[];
  failNext: boolean;
  msPerCall: number;
  beforeUnfiltered: (() => void) | null;
} = {
  responses: [],
  maxPageSize: 50,
  calls: [],
  failNext: false,
  msPerCall: 0,
  beforeUnfiltered: null,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

function tick({ minutes }: { minutes: number }): number {
  clock += minutes * 60_000;
  return clock;
}

function microIso({ ms, micro }: { ms: number; micro: number }): string {
  return new Date(ms).toISOString().replace('Z', `${String(micro).padStart(3, '0')}Z`);
}

function normaliseFilterTime(value: string): string {
  const parsed = new Date(value).toISOString();
  return parsed.replace('Z', '000Z');
}

function submit({ id, formId = FORM_ID, ms, micro = 0 }: { id: string; formId?: string; ms?: number; micro?: number }): void {
  const at = microIso({ ms: ms ?? tick({ minutes: 1 }), micro });
  vendor.responses.push({
    formId,
    responseId: id,
    createTime: at,
    lastSubmittedTime: at,
    answers: { q1: { questionId: 'q1', textAnswers: { answers: [{ value: id }] } } },
  });
}

function edit({ id }: { id: string }): void {
  const at = microIso({ ms: tick({ minutes: 1 }), micro: 0 });
  vendor.responses = vendor.responses.map((response) =>
    response.responseId === id ? { ...response, lastSubmittedTime: at } : response,
  );
}

function listFor(request: HttpRequest): FakeResponse[] {
  const query = request.queryParams ?? {};
  const filter = query['filter'];
  const formId = request.url.split('/forms/')[1].split('/')[0];
  const matches = vendor.responses.filter((response) => response.formId === formId);
  if (filter === undefined) {
    return matches;
  }
  const strict = filter.startsWith('timestamp > ');
  const bound = normaliseFilterTime(filter.replace(/^timestamp >=? /, ''));
  return matches.filter((response) =>
    strict ? response.lastSubmittedTime > bound : response.lastSubmittedTime >= bound,
  );
}

function installFakeForms(): void {
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
    if (!request.url.startsWith('https://forms.googleapis.com/v1/forms/') || !request.url.endsWith('/responses')) {
      throw new Error(`unexpected request ${request.url}`);
    }
    const query = request.queryParams ?? {};
    vendor.calls.push({ filter: query['filter'], pageToken: query['pageToken'], pageSize: query['pageSize'] });
    clock += vendor.msPerCall;
    if (query['filter'] === undefined && vendor.beforeUnfiltered !== null) {
      const hook = vendor.beforeUnfiltered;
      vendor.beforeUnfiltered = null;
      hook();
    }
    if (vendor.failNext) {
      vendor.failNext = false;
      throw new Error('Request failed with status 503');
    }
    const all = listFor(request).sort((a, b) => b.responseId.localeCompare(a.responseId));
    const offset = Number(query['pageToken'] ?? 0);
    const size = Math.min(Number(query['pageSize'] ?? 5000), vendor.maxPageSize);
    const page = all.slice(offset, offset + size);
    const nextOffset = offset + size;
    const body = page.length === 0 ? {} : {
      responses: page.map(({ formId: _formId, ...rest }) => rest),
      ...(nextOffset < all.length ? { nextPageToken: String(nextOffset) } : {}),
    };
    return { status: 200, headers: {}, body };
  });
}

function memoryStore(): { data: Map<string, string>; store: Store } {
  const data = new Map<string, string>();
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = data.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

function hookContext({
  store,
  isRepublish,
  runOn,
  formId = FORM_ID,
}: {
  store: Store;
  isRepublish?: boolean;
  runOn?: string;
  formId?: string;
}): HookContext {
  const propsValue = { form_id: formId, include_team_drives: false, run_on: runOn, info: undefined };
  return {
    ...createMockPollingTriggerContext<typeof newResponse.props>({ propsValue }),
    auth: CONNECTION,
    store,
    isRepublish,
    files: { write: async () => 'file-url', upload: async () => ({ id: 'file-id', url: 'file-url' }) },
  };
}

function asPollingTrigger(candidate: typeof newResponse) {
  if (candidate.type !== TriggerStrategy.POLLING) {
    throw new Error('New Response must be a polling trigger');
  }
  return candidate;
}

async function poll({ store, runOn }: { store: Store; runOn?: string }): Promise<string[]> {
  const events = await trigger.run(hookContext({ store, runOn }));
  return events.map(responseIdOf);
}

function responseIdOf(event: unknown): string {
  if (typeof event === 'object' && event !== null && 'responseId' in event && typeof event.responseId === 'string') {
    return event.responseId;
  }
  throw new Error('event without responseId');
}

async function enabled({ runOn }: { runOn?: string }): Promise<{ store: Store; data: Map<string, string> }> {
  const memory = memoryStore();
  await trigger.onEnable(hookContext({ store: memory.store, runOn }));
  return memory;
}

beforeEach(() => {
  vendor.responses = [];
  vendor.calls = [];
  vendor.maxPageSize = 50;
  vendor.failNext = false;
  vendor.msPerCall = 0;
  vendor.beforeUnfiltered = null;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  installFakeForms();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(['new_only', 'new_and_edited', undefined])('New Response behaviour (run_on=%s)', (runOn) => {
  it('fires once per new response across polls, never for responses that existed at enable, and keeps state across a republish', async () => {
    submit({ id: 'old-1' });
    submit({ id: 'old-2' });
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    expect(await poll({ store, runOn })).toEqual([]);
    submit({ id: 'new-1' });
    expect(await poll({ store, runOn })).toEqual(['new-1']);
    expect(await poll({ store, runOn })).toEqual([]);
    submit({ id: 'between' });
    await trigger.onDisable(hookContext({ store, runOn, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, runOn, isRepublish: true }));
    expect(await poll({ store, runOn })).toEqual(['between']);
    expect(await poll({ store, runOn })).toEqual([]);
    submit({ id: 'new-2' });
    expect(await poll({ store, runOn })).toEqual(['new-2']);
  });

  it('keeps the checkpoint when an older server calls onDisable without isRepublish during a republish', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    submit({ id: 'new-1' });
    expect(await poll({ store, runOn })).toEqual(['new-1']);
    submit({ id: 'between' });
    await trigger.onDisable(hookContext({ store, runOn }));
    await trigger.onEnable(hookContext({ store, runOn, isRepublish: true }));
    expect(await poll({ store, runOn })).toEqual(['between']);
    expect(await poll({ store, runOn })).toEqual([]);
  });

  it('fires both responses that share one millisecond when the second shows up a poll later', async () => {
    submit({ id: 'seed' });
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    const sameMs = tick({ minutes: 1 });
    submit({ id: 'tie-a', ms: sameMs, micro: 100 });
    tick({ minutes: 1 });
    expect(await poll({ store, runOn })).toEqual(['tie-a']);
    submit({ id: 'tie-b', ms: sameMs, micro: 900 });
    expect(await poll({ store, runOn })).toEqual(['tie-b']);
    expect(await poll({ store, runOn })).toEqual([]);
  });

  it('pages through every response that arrived between polls, with none lost or repeated', async () => {
    submit({ id: 'seed' });
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    const burst = Array.from({ length: vendor.maxPageSize * 2 + 7 }, (_, index) => `burst-${String(index).padStart(4, '0')}`);
    burst.forEach((id) => submit({ id }));
    vendor.calls = [];
    const fired = await poll({ store, runOn });
    expect(new Set(fired)).toEqual(new Set(burst));
    expect(fired).toHaveLength(burst.length);
    expect(vendor.calls.length).toBe(3);
    expect(await poll({ store, runOn })).toEqual([]);
  });

  it('writes no state when a request fails, so the next poll still delivers the response', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    submit({ id: 'after-outage' });
    vendor.failNext = true;
    await expect(trigger.run(hookContext({ store, runOn }))).rejects.toThrow('503');
    expect(await poll({ store, runOn })).toEqual(['after-outage']);
  });

  it('stops paging at the poll deadline without moving the checkpoint, so nothing is skipped', async () => {
    submit({ id: 'seed' });
    tick({ minutes: 1 });
    const { store, data } = await enabled({ runOn });
    const before = data.get('new_response_state');
    const burst = Array.from({ length: vendor.maxPageSize * 3 + 1 }, (_, index) => `slow-${String(index).padStart(4, '0')}`);
    burst.forEach((id) => submit({ id }));
    vendor.msPerCall = 20_000;
    await expect(trigger.run(hookContext({ store, runOn }))).rejects.toThrow('next check reads them again');
    expect(data.get('new_response_state')).toBe(before);
    vendor.msPerCall = 0;
    expect(new Set(await poll({ store, runOn }))).toEqual(new Set(burst));
  });

  it('starts from now when a poll finds a checkpoint saved for another form', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    submit({ id: 'other-form-old', formId: OTHER_FORM_ID });
    tick({ minutes: 1 });
    expect(await trigger.run(hookContext({ store, runOn, formId: OTHER_FORM_ID }))).toEqual([]);
    submit({ id: 'other-form-new', formId: OTHER_FORM_ID });
    const fired = await trigger.run(hookContext({ store, runOn, formId: OTHER_FORM_ID }));
    expect(fired.map(responseIdOf)).toEqual(['other-form-new']);
  });

  it('resets the checkpoint when the form changes on republish instead of replaying the new form', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    submit({ id: 'other-form-old', formId: OTHER_FORM_ID });
    tick({ minutes: 1 });
    await trigger.onEnable(hookContext({ store, runOn, isRepublish: true, formId: OTHER_FORM_ID }));
    expect(await trigger.run(hookContext({ store, runOn, formId: OTHER_FORM_ID }))).toEqual([]);
    submit({ id: 'other-form-new', formId: OTHER_FORM_ID });
    const fired = await trigger.run(hookContext({ store, runOn, formId: OTHER_FORM_ID }));
    expect(fired.map(responseIdOf)).toEqual(['other-form-new']);
  });

  it('every sampleData key exists in a real run item, and test() has the same shape', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    submit({ id: 'real' });
    const [real] = await trigger.run(hookContext({ store, runOn }));
    const [sample] = await trigger.test(hookContext({ store: memoryStore().store, runOn }));
    for (const key of Object.keys(trigger.sampleData ?? {})) {
      expect(real).toHaveProperty(key);
      expect(sample).toHaveProperty(key);
    }
    expect(sample).toEqual(real);
  });
});

describe('New Response edits', () => {
  it('new_only: an edited response never fires again, and the edit does not stay in every later read', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn: 'new_only' });
    submit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual(['alice']);
    edit({ id: 'alice' });
    submit({ id: 'bob' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual(['bob']);
    edit({ id: 'alice' });
    const editedAt = Date.parse(vendor.responses[0].lastSubmittedTime);
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
    vendor.calls = [];
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
    const lastFilter = vendor.calls[0].filter ?? '';
    expect(Date.parse(lastFilter.replace('timestamp > ', ''))).toBe(editedAt - 1);
  });

  it('switching new_only to new_and_edited on republish starts from now and does not fire an edit made before the switch', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn: 'new_only' });
    submit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual(['alice']);
    edit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
    tick({ minutes: 1 });
    await trigger.onDisable(hookContext({ store, runOn: 'new_and_edited', isRepublish: true }));
    await trigger.onEnable(hookContext({ store, runOn: 'new_and_edited', isRepublish: true }));
    expect(await poll({ store, runOn: 'new_and_edited' })).toEqual([]);
    edit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_and_edited' })).toEqual(['alice']);
    submit({ id: 'bob' });
    expect(await poll({ store, runOn: 'new_and_edited' })).toEqual(['bob']);
  });

  it('switching new_and_edited to new_only on republish starts from now and then ignores edits', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn: 'new_and_edited' });
    submit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_and_edited' })).toEqual(['alice']);
    tick({ minutes: 1 });
    await trigger.onEnable(hookContext({ store, runOn: 'new_only', isRepublish: true }));
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
    edit({ id: 'alice' });
    submit({ id: 'bob' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual(['bob']);
  });

  it('a poll that finds a checkpoint saved for the other mode starts from now', async () => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn: 'new_only' });
    submit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual(['alice']);
    edit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
    tick({ minutes: 1 });
    expect(await poll({ store, runOn: 'new_and_edited' })).toEqual([]);
    edit({ id: 'alice' });
    expect(await poll({ store, runOn: 'new_and_edited' })).toEqual(['alice']);
  });

  it('new_only: editing a response that existed before the flow was enabled does not fire', async () => {
    submit({ id: 'before-enable' });
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn: 'new_only' });
    edit({ id: 'before-enable' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
  });

  it.each(['new_and_edited', undefined])('run_on=%s: fires once for every edit, never twice for the same edit', async (runOn) => {
    tick({ minutes: 1 });
    const { store } = await enabled({ runOn });
    submit({ id: 'alice' });
    expect(await poll({ store, runOn })).toEqual(['alice']);
    edit({ id: 'alice' });
    expect(await poll({ store, runOn })).toEqual(['alice']);
    expect(await poll({ store, runOn })).toEqual([]);
    edit({ id: 'alice' });
    expect(await poll({ store, runOn })).toEqual(['alice']);
    expect(await poll({ store, runOn })).toEqual([]);
  });
});

describe('New Response store written by 0.7.x', () => {
  it('keeps the old checkpoint: the last delivered response does not fire again and later ones do', async () => {
    submit({ id: 'delivered' });
    const lastPoll = Date.parse(vendor.responses[0].lastSubmittedTime);
    const { store, data } = memoryStore();
    await store.put('lastPoll', lastPoll);
    expect(await poll({ store })).toEqual([]);
    expect(data.has('lastPoll')).toBe(false);
    submit({ id: 'next' });
    edit({ id: 'delivered' });
    expect((await poll({ store })).sort()).toEqual(['delivered', 'next']);
  });

  it('reads the old lastPoll key only until it is migrated, not on every poll', async () => {
    submit({ id: 'delivered' });
    const lastPoll = Date.parse(vendor.responses[0].lastSubmittedTime);
    const { store, data } = memoryStore();
    await store.put('lastPoll', lastPoll);
    const reads: string[] = [];
    const deletes: string[] = [];
    const tracked: Store = {
      put: store.put,
      get: async <T>(key: string) => {
        reads.push(key);
        return store.get<T>(key);
      },
      delete: async (key: string) => {
        deletes.push(key);
        await store.delete(key);
      },
    };
    expect(await poll({ store: tracked })).toEqual([]);
    expect(reads).toEqual(['new_response_state', 'lastPoll']);
    expect(deletes).toEqual(['lastPoll']);
    expect(data.has('lastPoll')).toBe(false);
    reads.length = 0;
    deletes.length = 0;
    submit({ id: 'next' });
    expect(await poll({ store: tracked })).toEqual(['next']);
    expect(reads).toEqual(['new_response_state']);
    expect(deletes).toEqual([]);
  });

  it('keeps the old checkpoint across the version-upgrade republish', async () => {
    submit({ id: 'delivered' });
    const lastPoll = Date.parse(vendor.responses[0].lastSubmittedTime);
    const { store } = memoryStore();
    await store.put('lastPoll', lastPoll);
    submit({ id: 'during-upgrade' });
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(await poll({ store })).toEqual(['during-upgrade']);
  });

  it('upgrade to new_only keeps the 0.7.x checkpoint: undelivered new responses fire once, older edited responses never', async () => {
    submit({ id: 'older-edited' });
    submit({ id: 'delivered' });
    const lastPoll = Date.parse(vendor.responses[1].lastSubmittedTime);
    const { store } = memoryStore();
    await store.put('lastPoll', lastPoll);
    edit({ id: 'older-edited' });
    submit({ id: 'created-after-last-poll' });
    await trigger.onEnable(hookContext({ store, runOn: 'new_only', isRepublish: true }));
    expect(await poll({ store, runOn: 'new_only' })).toEqual(['created-after-last-poll']);
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
    edit({ id: 'created-after-last-poll' });
    edit({ id: 'older-edited' });
    expect(await poll({ store, runOn: 'new_only' })).toEqual([]);
  });
});

describe('New Response test()', () => {
  it.each([
    ['new_only', ['created-5', 'created-4', 'created-3', 'created-2', 'created-1']],
    ['new_and_edited', ['created-0', 'created-5', 'created-4', 'created-3', 'created-2']],
  ])('run_on=%s returns the five newest by the time that run() keys on', async (runOn, expected) => {
    for (let index = 0; index <= 5; index += 1) {
      submit({ id: `created-${index}` });
    }
    edit({ id: 'created-0' });
    const sample = await trigger.test(hookContext({ store: memoryStore().store, runOn }));
    expect(sample.map(responseIdOf)).toEqual(expected);
  });

  it('reads only a recent window when it holds enough responses, not the whole history', async () => {
    for (let index = 0; index < 300; index += 1) {
      submit({ id: `history-${index}`, ms: Date.parse('2024-01-01T00:00:00.000Z') + index * 60_000 });
    }
    for (let index = 0; index < 6; index += 1) {
      submit({ id: `recent-${index}` });
    }
    const sample = await trigger.test(hookContext({ store: memoryStore().store, runOn: 'new_only' }));
    expect(sample.map(responseIdOf)).toEqual(['recent-5', 'recent-4', 'recent-3', 'recent-2', 'recent-1']);
    expect(vendor.calls).toHaveLength(1);
    expect(vendor.calls[0].filter).toBeDefined();
  });

  it('falls back to older responses when the form has fewer than five recent ones, reading one page at most', async () => {
    for (let index = 0; index < 120; index += 1) {
      submit({ id: `history-${String(index).padStart(3, '0')}`, ms: Date.parse('2024-01-01T00:00:00.000Z') + index * 60_000 });
    }
    submit({ id: 'recent' });
    const sample = await trigger.test(hookContext({ store: memoryStore().store }));
    expect(sample.map(responseIdOf)[0]).toBe('recent');
    expect(sample).toHaveLength(5);
    expect(vendor.calls.filter((call) => call.filter === undefined)).toHaveLength(1);
  });

  it.each(['new_only', 'new_and_edited'])('run_on=%s keeps recent responses found in the windows when the fallback page of a large form misses them', async (runOn) => {
    vendor.maxPageSize = 5000;
    for (let index = 0; index < 5001; index += 1) {
      submit({ id: `history-${String(index).padStart(4, '0')}`, ms: Date.parse('2024-01-01T00:00:00.000Z') + index * 1_000 });
    }
    submit({ id: 'a-recent-1' });
    submit({ id: 'a-recent-2' });
    const sample = await trigger.test(hookContext({ store: memoryStore().store, runOn }));
    expect(sample.map(responseIdOf)).toEqual(['a-recent-2', 'a-recent-1', 'history-5000', 'history-4999', 'history-4998']);
    expect(vendor.calls.filter((call) => call.filter === undefined)).toHaveLength(1);
  });

  it.each(['new_only', 'new_and_edited'])('run_on=%s keeps the newest copy of a response edited between the window reads and the fallback page', async (runOn) => {
    for (let index = 0; index < 10; index += 1) {
      submit({ id: `history-${index}`, ms: Date.parse('2024-01-01T00:00:00.000Z') + index * 60_000 });
    }
    submit({ id: 'recent' });
    vendor.beforeUnfiltered = () => {
      edit({ id: 'recent' });
      vendor.responses = vendor.responses.map((response) =>
        response.responseId === 'recent'
          ? { ...response, answers: { q1: { questionId: 'q1', textAnswers: { answers: [{ value: 'recent-edited' }] } } } }
          : response,
      );
    };
    const sample = await trigger.test(hookContext({ store: memoryStore().store, runOn }));
    expect(sample.map(responseIdOf)[0]).toBe('recent');
    expect(JSON.stringify(sample[0])).toContain('recent-edited');
    expect(sample.map(responseIdOf).filter((id) => id === 'recent')).toHaveLength(1);
  });

  it('works on a form with no responses', async () => {
    expect(await trigger.test(hookContext({ store: memoryStore().store }))).toEqual([]);
  });
});

const FORM_ID = 'form-behaviour';
const OTHER_FORM_ID = 'form-other';

const trigger = asPollingTrigger(newResponse);

const CONNECTION: HookContext['auth'] = {
  type: AppConnectionType.OAUTH2,
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  client_id: 'client-id',
  client_secret: 'client-secret',
  redirect_url: 'https://example.com/redirect',
  token_type: 'Bearer',
  token_url: 'https://oauth2.googleapis.com/token',
  scope: 'email',
  claimed_at: Math.round(Date.parse('2026-11-01T10:00:00.000Z') / 1000),
  expires_in: 3600,
  data: {},
};

type HookContext = Parameters<ReturnType<typeof asPollingTrigger>['run']>[0];

type FakeResponse = {
  formId: string;
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers: Record<string, { questionId: string; textAnswers: { answers: { value: string }[] } }>;
};
