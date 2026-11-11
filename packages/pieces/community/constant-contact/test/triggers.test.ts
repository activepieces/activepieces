import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ccTransport } from '../src/lib/common/client';
import { ContactPollConfig, contactPolling } from '../src/lib/common/polling';
import { newContactTrigger } from '../src/lib/triggers/new-contact';
import { updatedContactTrigger } from '../src/lib/triggers/updated-contact';
import { contactUnsubscribedTrigger } from '../src/lib/triggers/contact-unsubscribed';

beforeEach(() => stubTransport());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const NEW_CONFIG: ContactPollConfig = {
  storeKey: 'k',
  operation: 'check for new contacts',
  afterParam: 'created_after',
  beforeParam: 'created_before',
  timestampField: 'created_at',
  query: {},
};

describe('trigger metadata', () => {
  test('every trigger is READ with aiMetadata, sampleData and outputSchema', () => {
    for (const trigger of [newContactTrigger, updatedContactTrigger, contactUnsubscribedTrigger]) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description).toBeTruthy();
      expect(trigger.sampleData).toBeTruthy();
      expect(trigger.outputSchema?.fields.length).toBeGreaterThan(0);
    }
    expect(updatedContactTrigger.description).toContain('loop');
  });
});

describe('contact polling', () => {
  test('onEnable sets the checkpoint to now and keeps it on republish', async () => {
    const { store, data } = memoryStore({});
    await contactPolling.onEnable({ store, isRepublish: false, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:00:00Z') });
    expect(data.get('k')).toEqual({ scanned_through: '2026-11-10T10:00:00.000Z', recent: [] });
    await contactPolling.onEnable({ store, isRepublish: true, config: NEW_CONFIG, now: () => Date.parse('2026-11-11T10:00:00Z') });
    expect(data.get('k')).toEqual({ scanned_through: '2026-11-10T10:00:00.000Z', recent: [] });
  });

  test('polls the window with overlap, pages every cursor, emits oldest first and dedupes', async () => {
    const { store, data } = memoryStore({ initial: { k: { scanned_through: '2026-11-10T10:00:00.000Z', recent: ['old|2026-11-10T09:58:00Z'] } } });
    const seen = route({
      routes: {
        'GET /v3/contacts': [
          {
            status: 200,
            body: {
              contacts: [
                { contact_id: 'b', created_at: '2026-11-10T10:03:00Z' },
                { contact_id: 'old', created_at: '2026-11-10T09:58:00Z' },
              ],
              _links: { next: { href: '/v3/contacts?cursor=cGFnZTI=' } },
            },
          },
          { status: 200, body: { contacts: [{ contact_id: 'a', created_at: '2026-11-10T10:01:00Z' }, { contact_id: 'b', created_at: '2026-11-10T10:03:00Z' }] } },
        ],
      },
    });
    const items = await contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:05:00Z') });
    expect(items.map((item) => item['contact_id'])).toEqual(['a', 'b']);
    expect(seen[0].query.get('created_after')).toBe('2026-11-10T09:55:00.000Z');
    expect(seen[0].query.get('created_before')).toBe('2026-11-10T10:05:00.000Z');
    expect(seen[0].query.get('limit')).toBe('500');
    expect(seen[1].query.get('cursor')).toBe('cGFnZTI=');
    expect(seen[1].query.get('created_after')).toBe('2026-11-10T09:55:00.000Z');
    const state = contactPolling.readState(data.get('k'));
    expect(state?.scanned_through).toBe('2026-11-10T10:05:00.000Z');
    expect(state?.recent).toEqual(expect.arrayContaining(['a|2026-11-10T10:01:00Z', 'b|2026-11-10T10:03:00Z']));

    route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [{ contact_id: 'b', created_at: '2026-11-10T10:03:00Z' }] } } } });
    expect(await contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:06:00Z') })).toEqual([]);
  });

  test('a failed request throws and leaves the checkpoint untouched', async () => {
    const initial = { scanned_through: '2026-11-10T10:00:00.000Z', recent: [] };
    const { store, data } = memoryStore({ initial: { k: initial } });
    route({
      routes: {
        'GET /v3/contacts': [
          { status: 200, body: { contacts: [{ contact_id: 'a', created_at: '2026-11-10T10:01:00Z' }], _links: { next: { href: '/v3/contacts?cursor=eA==' } } } },
          { status: 500, body: [{ error_key: 'server', error_message: 'boom' }] },
        ],
      },
    });
    await expect(contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:05:00Z') })).rejects.toThrow('HTTP 500');
    expect(data.get('k')).toEqual(initial);
    expect(store.put).not.toHaveBeenCalled();
  });

  test('a missing checkpoint starts from now without emitting history', async () => {
    const { store, data } = memoryStore({});
    const seen = route({ routes: {} });
    expect(await contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:05:00Z') })).toEqual([]);
    expect(seen).toHaveLength(0);
    expect(data.get('k')).toEqual({ scanned_through: '2026-11-10T10:05:00.000Z', recent: [] });
  });

  test('unsubscribed trigger filters by status and opt-out date and keys on opt_out_date', async () => {
    const { store } = memoryStore({ initial: { cc_contact_unsubscribed_checkpoint: { scanned_through: '2026-11-10T10:00:00.000Z', recent: [] } } });
    const seen = route({
      routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [{ contact_id: 'a', email_address: { address: 'a@b.co', opt_out_date: '2026-11-10T10:02:00Z' } }] } } },
    });
    const items = await contactUnsubscribedTrigger.run(ctx({ propsValue: {}, store }));
    expect(items).toHaveLength(1);
    expect(seen[0].query.get('status')).toBe('unsubscribed');
    expect(seen[0].query.has('optout_after')).toBe(true);
    expect(seen[0].query.has('optout_before')).toBe(true);
  });

  test('unsubscribed trigger does not refire when only updated_at changes', async () => {
    const { store } = memoryStore({
      initial: { cc_contact_unsubscribed_checkpoint: { scanned_through: '2026-11-10T10:04:00.000Z', recent: ['a|2026-11-10T10:02:00Z'] } },
    });
    route({
      routes: {
        'GET /v3/contacts': {
          status: 200,
          body: { contacts: [{ contact_id: 'a', updated_at: '2026-11-10T10:04:30Z', email_address: { address: 'a@b.co', opt_out_date: '2026-11-10T10:02:00Z' } }] },
        },
      },
    });
    expect(await contactUnsubscribedTrigger.run(ctx({ propsValue: {}, store }))).toEqual([]);
  });

  test('a window above the per-poll cap narrows its end, advances to it, and the next poll returns the rest', async () => {
    const { store, data } = memoryStore({ initial: { k: { scanned_through: '2026-11-10T09:00:00.000Z', recent: [] } } });
    const early = ['09:10', '09:12', '09:14'].map((time, index) => ({ contact_id: `e${index}`, created_at: `2026-11-10T${time}:00.000Z` }));
    const late = ['09:50', '09:52', '09:54', '09:56'].map((time, index) => ({ contact_id: `l${index}`, created_at: `2026-11-10T${time}:00.000Z` }));
    const seen = windowedContacts({ contacts: [...early, ...late] });
    const first = await contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:00:00Z'), maxItems: 4 });
    expect(first.map((item) => item['contact_id'])).toEqual(['e0', 'e1', 'e2']);
    expect(contactPolling.readState(data.get('k'))?.scanned_through).toBe('2026-11-10T09:30:00.000Z');
    expect(seen.some((query) => query.get('created_before') === '2026-11-10T10:00:00.000Z')).toBe(true);
    const second = await contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:01:00Z'), maxItems: 4 });
    expect(second.map((item) => item['contact_id'])).toEqual(['l0', 'l1', 'l2', 'l3']);
    expect(contactPolling.readState(data.get('k'))?.scanned_through).toBe('2026-11-10T10:01:00.000Z');
  });

  test('more contacts than the cap inside one second throws and keeps the checkpoint', async () => {
    const initial = { scanned_through: '2026-11-10T09:00:00.000Z', recent: [] };
    const { store, data } = memoryStore({ initial: { k: initial } });
    windowedContacts({ contacts: Array.from({ length: 5 }, (_, index) => ({ contact_id: `c${index}`, created_at: '2026-11-10T09:00:00.400Z' })) });
    await expect(
      contactPolling.poll({ accessToken: 't', store, config: NEW_CONFIG, now: () => Date.parse('2026-11-10T10:00:00Z'), maxItems: 4 }),
    ).rejects.toThrow('more than 4 contacts share one second');
    expect(data.get('k')).toEqual(initial);
    expect(store.put).not.toHaveBeenCalled();
  });

  test('test() reads a sample page and never touches the store', async () => {
    const { store } = memoryStore({});
    const seen = route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [{ contact_id: 'a' }] } } } });
    expect(await updatedContactTrigger.test(ctx({ propsValue: {}, store }))).toEqual([{ contact_id: 'a' }]);
    expect(seen[0].query.get('limit')).toBe('5');
    expect(store.put).not.toHaveBeenCalled();
    expect(store.get).not.toHaveBeenCalled();
  });
});



function stubTransport(): void {
  vi.spyOn(ccTransport, 'getDispatcher').mockResolvedValue(undefined);
  vi.spyOn(ccTransport, 'sleep').mockResolvedValue(undefined);
}

function route({ routes }: { routes: Record<string, Reply | Reply[]> }): Seen[] {
  const seen: Seen[] = [];
  const counters = new Map<string, number>();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const key = `${init?.method ?? 'GET'} ${url.pathname}`;
      const headers = new Headers(init?.headers);
      seen.push({
        key,
        url,
        query: url.searchParams,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
        authorization: headers.get('authorization'),
        redirect: init?.redirect,
      });
      const entry = routes[key];
      const index = counters.get(key) ?? 0;
      counters.set(key, index + 1);
      const reply = Array.isArray(entry) ? entry[Math.min(index, entry.length - 1)] : entry;
      if (reply === undefined) {
        return new Response(JSON.stringify([{ error_key: 'test.unexpected', error_message: `unexpected ${key}` }]), { status: 599 });
      }
      if (reply.status === 204) {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return seen;
}

function ctx({ propsValue, store }: { propsValue: Record<string, unknown>; store?: unknown }) {
  return Object.assign(Object.create(null), {
    auth: { type: 'OAUTH2', access_token: 'test-token' },
    propsValue,
    store,
  });
}

function memoryStore({ initial }: { initial?: Record<string, unknown> }) {
  const data = new Map<string, unknown>(Object.entries(initial ?? {}));
  return {
    data,
    store: {
      put: vi.fn(async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      }),
      get: vi.fn(async (key: string) => data.get(key) ?? null),
      delete: vi.fn(async (key: string) => {
        data.delete(key);
      }),
    },
  };
}


type Reply = { status: number; body?: unknown };

type Seen = {
  key: string;
  url: URL;
  query: URLSearchParams;
  body: unknown;
  authorization: string | null;
  redirect: RequestRedirect | undefined;
};

function windowedContacts({ contacts }: { contacts: { contact_id: string; created_at: string }[] }): URLSearchParams[] {
  const seen: URLSearchParams[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(input);
      seen.push(url.searchParams);
      const after = Date.parse(url.searchParams.get('created_after') ?? '');
      const before = Date.parse(url.searchParams.get('created_before') ?? '');
      const offset = Number(url.searchParams.get('cursor') ?? '0');
      const matching = contacts.filter((contact) => Date.parse(contact.created_at) > after && Date.parse(contact.created_at) < before);
      const page = matching.slice(offset, offset + 2);
      const next = offset + 2 < matching.length ? { _links: { next: { href: `/v3/contacts?limit=500&cursor=${offset + 2}` } } } : {};
      return new Response(JSON.stringify({ contacts: page, ...next }), { status: 200 });
    }),
  );
  return seen;
}
