import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { klaviyoTransport } from '../src/lib/common/client';
import { newProfileTrigger } from '../src/lib/triggers/new-profile';
import { newEventTrigger, pollNewEvents } from '../src/lib/triggers/new-event';
import { profileAddedToListOrSegmentTrigger } from '../src/lib/triggers/profile-added-to-list-segment';

function stub({ replies }: { replies: Reply[] }): URL[] {
  const seen: URL[] = [];
  vi.spyOn(klaviyoTransport, 'getDispatcher').mockResolvedValue({});
  vi.stubGlobal('fetch', async (input: string | URL) => {
    seen.push(new URL(String(input)));
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    return new Response(JSON.stringify(reply.body), { status: reply.status });
  });
  return seen;
}

function memoryStore({ initial }: { initial: Record<string, unknown> }): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

function profilesPage({ count, created, next, offset }: { count: number; created: string; next: string | null; offset: number }): Reply {
  return {
    status: 200,
    body: {
      data: Array.from({ length: count }, (_, index) => ({ type: 'profile', id: `P${offset + index}`, attributes: { created, updated: created } })),
      links: { next },
    },
  };
}

function eventsPage({ ids, next, datetime = '2026-11-11T09:00:00+00:00' }: { ids: string[]; next: string | null; datetime?: string }): Reply {
  return {
    status: 200,
    body: {
      data: ids.map((id) => ({ type: 'event', id, attributes: { datetime, timestamp: 1, uuid: id, event_properties: {} }, relationships: { metric: { data: { type: 'metric', id: 'M1' } } } })),
      links: { next },
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('klaviyo New Profile trigger', () => {
  test('a same-second batch past the cap is kept whole', async () => {
    const same = '2026-11-11T09:00:00+00:00';
    const seen = stub({
      replies: [
        ...Array.from({ length: 5 }, (_, page) => profilesPage({ count: 100, created: same, next: `https://a.klaviyo.com/api/profiles?page%5Bcursor%5D=c${page + 1}`, offset: page * 100 })),
        profilesPage({ count: 50, created: same, next: 'https://a.klaviyo.com/api/profiles?page%5Bcursor%5D=c6', offset: 500 }),
        { status: 200, body: { data: [{ type: 'profile', id: 'LATER', attributes: { created: '2026-11-11T09:00:01+00:00' } }], links: { next: null } } },
      ],
    });
    const store = memoryStore({ initial: { lastPoll: Date.parse('2026-11-11T08:00:00Z') } });
    const context = { ...createMockPollingTriggerContext({ propsValue: {} }), auth: AUTH, store };
    const items = await newProfileTrigger.run(context);
    expect(items).toHaveLength(550);
    expect(seen[0].searchParams.get('filter')).toBe('greater-than(created,2026-11-11T08:00:00.000Z)');
    expect(seen[1].searchParams.get('page[cursor]')).toBe('c1');
    expect(store.data.get('lastPoll')).toBe(Date.parse(same));
  });
});

describe('klaviyo Profile Added to List/Segment trigger', () => {
  test('qa: polls the encoded segment members by joined_group_at and keeps a same-second batch past the 1000 cap', async () => {
    const same = '2026-11-11T09:00:00+00:00';
    const member = ({ id, joined }: { id: string; joined: string }) => ({ type: 'profile', id, attributes: { created: same, joined_group_at: joined } });
    const seen = stub({
      replies: [
        ...Array.from({ length: 10 }, (_, page) => ({ status: 200, body: { data: Array.from({ length: 100 }, (_, index) => member({ id: `P${page * 100 + index}`, joined: same })), links: { next: `https://a.klaviyo.com/api/x?page%5Bcursor%5D=c${page + 1}` } } })),
        { status: 200, body: { data: [member({ id: 'TIE', joined: same }), member({ id: 'LATER', joined: '2026-11-11T09:00:05+00:00' })], links: { next: null } } },
      ],
    });
    const store = memoryStore({ initial: { lastPoll: Date.parse('2026-11-11T08:00:00Z') } });
    const context = { ...createMockPollingTriggerContext({ propsValue: { targetType: 'segment', listId: undefined, segmentId: 'S/1' } }), auth: AUTH, store };
    const items = await profileAddedToListOrSegmentTrigger.run(context);
    expect(seen[0].pathname).toBe('/api/segments/S%2F1/profiles');
    expect(seen[0].searchParams.get('filter')).toBe('greater-than(joined_group_at,2026-11-11T08:00:00.000Z)');
    expect(seen[0].searchParams.get('sort')).toBe('joined_group_at');
    expect(items).toHaveLength(1001);
    expect(items[1000]).toMatchObject({ id: 'TIE', target_type: 'segment', target_id: 'S/1', joined_group_at: same });
  });
});

describe('klaviyo New Event trigger', () => {
  test('applies the 10-minute look-back, dedupes by id and stores the poll time', async () => {
    const now = Date.parse('2026-11-11T10:00:00Z');
    const seen = stub({ replies: [eventsPage({ ids: ['E1', 'E2'], next: null })] });
    const store = memoryStore({ initial: { klaviyo_new_event_state: { since: SINCE, checkpoint: '2026-11-11T09:50:00.000Z', recentIds: ['E1'] } } });
    const items = await pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now });
    expect(seen[0].searchParams.get('filter')).toBe('equals(metric_id,"M1"),greater-or-equal(datetime,2026-11-11T09:40:00.000Z)');
    expect(items.map((item) => item['id'])).toEqual(['E2']);
    expect(store.data.get('klaviyo_new_event_state')).toEqual({ since: SINCE, checkpoint: '2026-11-11T10:00:00.000Z', recentIds: ['E1', 'E2'] });
  });

  test('does not fire twice for the same event on the next poll', async () => {
    stub({ replies: [eventsPage({ ids: ['E1', 'E2'], next: null })] });
    const store = memoryStore({ initial: { klaviyo_new_event_state: { since: SINCE, checkpoint: '2026-11-11T09:50:00.000Z', recentIds: ['E1', 'E2'] } } });
    expect(await pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now: Date.parse('2026-11-11T10:05:00Z') })).toEqual([]);
  });

  test('does not write the store when a page fails', async () => {
    stub({ replies: [eventsPage({ ids: ['E1'], next: 'https://a.klaviyo.com/api/events?page%5Bcursor%5D=c2' }), { status: 500, body: { errors: [{ detail: 'boom' }] } }] });
    const initial = { since: SINCE, checkpoint: '2026-11-11T09:50:00.000Z', recentIds: [] };
    const store = memoryStore({ initial: { klaviyo_new_event_state: initial } });
    await expect(pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: 'P1', now: Date.now() })).rejects.toThrow('boom');
    expect(store.data.get('klaviyo_new_event_state')).toEqual(initial);
  });

  test('qa: more than 2000 events in one window throws and keeps the old state', async () => {
    const pages = Array.from({ length: 11 }, (_, page) => eventsPage({ ids: Array.from({ length: 200 }, (_, index) => `E${page * 200 + index}`), next: `https://a.klaviyo.com/api/events?page%5Bcursor%5D=c${page + 1}` }));
    const seen = stub({ replies: pages });
    const initial = { since: SINCE, checkpoint: '2026-11-11T09:50:00.000Z', recentIds: ['OLD'] };
    const store = memoryStore({ initial: { klaviyo_new_event_state: initial } });
    await expect(pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now: Date.parse('2026-11-11T10:00:00Z') })).rejects.toThrow('more than 2000 events');
    expect(seen).toHaveLength(10);
    expect(store.data.get('klaviyo_new_event_state')).toEqual(initial);
  });

  test('qa: a first poll without state only stores a checkpoint and fires nothing', async () => {
    const seen = stub({ replies: [eventsPage({ ids: ['E1'], next: null })] });
    const store = memoryStore({ initial: {} });
    expect(await pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now: Date.parse('2026-11-11T10:00:00Z') })).toEqual([]);
    expect(seen).toHaveLength(0);
    expect(store.data.get('klaviyo_new_event_state')).toEqual({ since: '2026-11-11T10:00:00.000Z', checkpoint: '2026-11-11T10:00:00.000Z', recentIds: [] });
  });

  test('first poll after enable skips events from before enable and returns later ones', async () => {
    const enabledAt = '2026-11-11T10:00:00.000Z';
    stub({
      replies: [
        {
          status: 200,
          body: {
            data: [
              { type: 'event', id: 'BEFORE', attributes: { datetime: '2026-11-11T09:55:00+00:00', timestamp: 1, uuid: 'b', event_properties: {} }, relationships: {} },
              { type: 'event', id: 'AFTER', attributes: { datetime: '2026-11-11T10:01:00+00:00', timestamp: 2, uuid: 'a', event_properties: {} }, relationships: {} },
            ],
            links: { next: null },
          },
        },
      ],
    });
    const store = memoryStore({ initial: {} });
    const context = { ...createMockPollingTriggerContext({ propsValue: { metric_id: 'M1', profile_id: undefined } }), auth: AUTH, store };
    vi.useFakeTimers({ now: Date.parse(enabledAt), toFake: ['Date'] });
    await newEventTrigger.onEnable(context);
    vi.useRealTimers();
    const items = await pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now: Date.parse('2026-11-11T10:05:00Z') });
    expect(items.map((item) => item['id'])).toEqual(['AFTER']);
  });

  test('since stays at the enable time across polls', async () => {
    stub({ replies: [eventsPage({ ids: ['E1'], next: null, datetime: '2026-11-11T10:02:00+00:00' })] });
    const store = memoryStore({ initial: { klaviyo_new_event_state: { since: '2026-11-11T10:00:00.000Z', checkpoint: '2026-11-11T10:00:00.000Z', recentIds: [] } } });
    await pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now: Date.parse('2026-11-11T10:05:00Z') });
    await pollNewEvents({ auth: AUTH, store, metricId: 'M1', profileId: undefined, now: Date.parse('2026-11-11T10:10:00Z') });
    expect(store.data.get('klaviyo_new_event_state')).toMatchObject({ since: '2026-11-11T10:00:00.000Z', checkpoint: '2026-11-11T10:10:00.000Z' });
  });

  test('republish keeps the existing state', async () => {
    const existing = { since: '2026-11-11T08:00:00.000Z', checkpoint: '2026-11-11T09:00:00.000Z', recentIds: ['E1'] };
    const store = memoryStore({ initial: { klaviyo_new_event_state: existing } });
    const context = { ...createMockPollingTriggerContext({ propsValue: { metric_id: 'M1', profile_id: undefined } }), auth: AUTH, store, isRepublish: true };
    await newEventTrigger.onEnable(context);
    expect(store.data.get('klaviyo_new_event_state')).toEqual(existing);
  });

  test('test() returns the latest events and writes no state', async () => {
    const seen = stub({ replies: [eventsPage({ ids: ['E9'], next: null })] });
    const store = memoryStore({ initial: {} });
    const context = { ...createMockPollingTriggerContext({ propsValue: { metric_id: 'M1', profile_id: undefined } }), auth: AUTH, store };
    const items = await newEventTrigger.test(context);
    expect(items).toHaveLength(1);
    expect(seen[0].searchParams.get('sort')).toBe('-datetime');
    expect(store.data.size).toBe(0);
  });
});

const SINCE = '2026-11-11T08:00:00.000Z';

const AUTH: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: 'pk_test' };

type Reply = { status: number; body: unknown };
