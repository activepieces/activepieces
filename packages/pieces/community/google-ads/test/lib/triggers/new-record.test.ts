import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const search = vi.fn<(params: { query: string }) => Promise<unknown>>();
const searchAll = vi.fn<(params: { query: string; maxRows?: number }) => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { search, searchAll } };
});

const { newRecord } = await import('../../../src/lib/triggers/new-record');
const { EVENTS_PER_POLL, MAX_BOUNDARY_IDS, OVERLAP_MINUTES, SEEN_CAP, seenKey } = await import('../../../src/lib/common/change-events');

const AUTH = { access_token: 'ya29.test-token' };
const KEY = 'google_ads_new_record_last_id';
const EVENTS_KEY = 'google_ads_new_record_create_events';
const CID = 'customers/1234567890';

function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    get: async <T>(key: string) => (data.has(key) ? (data.get(key) as T) : null),
    put: async <T>(key: string, value: T) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function triggerContext(resourceType: string, store: ReturnType<typeof memoryStore>) {
  return { auth: AUTH, propsValue: { customerId: '1234567890', resourceType }, store } as never;
}

type FakeEvent = { id: string; time: string; target: string };

function adGroupOf(event: FakeEvent): string {
  return event.target.split('~')[0];
}

function scramble(id: string): number {
  let hash = 2166136261;
  for (const char of id) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  return hash;
}

function compareFakeEvents(a: FakeEvent, b: FakeEvent): number {
  if (a.time !== b.time) return a.time < b.time ? -1 : 1;
  const groups = Number(BigInt(adGroupOf(a)) - BigInt(adGroupOf(b)));
  return groups !== 0 ? groups : scramble(a.id) - scramble(b.id);
}

function fakeAccount(collection: 'adGroupCriteria' | 'adGroupAds' = 'adGroupCriteria') {
  const events: FakeEvent[] = [];
  const removed = new Set<string>();
  const hidden = new Set<string>();
  const placements = new Set<string>();
  const zone = { timeZone: 'UTC' };
  search.mockImplementation(async ({ query }) => (query.includes('FROM customer') ? { results: [{ customer: { timeZone: zone.timeZone } }] } : { results: [] }));
  searchAll.mockImplementation(async ({ query }) => {
    if (query.includes('FROM change_event')) {
      const after = /change_date_time > '([^']+)'/.exec(query)?.[1];
      const from = /change_date_time >= '([^']+)'/.exec(query)?.[1];
      const until = /change_date_time <= '([^']+)'/.exec(query)?.[1];
      const fromGroup = /ad_group\.id >= (\d+)/.exec(query)?.[1];
      const limit = Number(/LIMIT (\d+)$/.exec(query)?.[1]);
      const matching = events
        .filter((event) => (after === undefined || event.time > after) && (from === undefined || event.time >= from) && (until === undefined || event.time <= until))
        .filter((event) => fromGroup === undefined || BigInt(adGroupOf(event)) >= BigInt(fromGroup))
        .sort(compareFakeEvents);
      const ordered = query.includes(' DESC ') ? matching.reverse() : matching;
      const results = ordered.slice(0, limit).map((event) => ({
        changeEvent: {
          resourceName: `${CID}/changeEvents/${event.id}`,
          changeDateTime: event.time,
          changeResourceName: `${CID}/${collection}/${event.target}`,
        },
        adGroup: { resourceName: `${CID}/adGroups/${adGroupOf(event)}`, id: adGroupOf(event) },
      }));
      return { results, truncated: false };
    }
    const names = [...query.matchAll(/'(customers\/[^']+)'/g)].map((match) => match[1]).filter((name) => !hidden.has(name));
    const key = collection === 'adGroupCriteria' ? 'adGroupCriterion' : 'adGroupAd';
    const typed = (resourceName: string) => (collection === 'adGroupCriteria' && query.includes('ad_group_criterion.type FROM') ? { type: placements.has(resourceName) ? 'PLACEMENT' : 'KEYWORD' } : {});
    return { results: names.map((resourceName) => ({ [key]: { resourceName, status: removed.has(resourceName) ? 'REMOVED' : 'ENABLED', ...typed(resourceName) } })), truncated: false };
  });
  return {
    add: (event: FakeEvent) => events.push(event),
    remove: (target: string) => removed.add(`${CID}/${collection}/${target}`),
    placement: (target: string) => placements.add(`${CID}/${collection}/${target}`),
    hide: (target: string) => hidden.add(`${CID}/${collection}/${target}`),
    show: (target: string) => hidden.delete(`${CID}/${collection}/${target}`),
    setTimeZone: (timeZone: string) => {
      zone.timeZone = timeZone;
    },
  };
}

async function enableBeforePolling(resourceType: string, store: ReturnType<typeof memoryStore>, at = '2026-10-07T11:00:00Z') {
  const polledAt = new Date();
  vi.setSystemTime(new Date(at));
  await newRecord.onEnable(triggerContext(resourceType, store));
  vi.setSystemTime(polledAt);
}

function firedNames(output: unknown): string[] {
  return (output as Array<Record<string, { resourceName: string }>>).map((row) => Object.values(row)[0].resourceName.split('/').pop() ?? '');
}

function recordQueries(): string[] {
  return searchAll.mock.calls.map(([params]) => params.query).filter((query) => !query.includes('FROM change_event'));
}

function eventQueries(): string[] {
  return searchAll.mock.calls.map(([params]) => params.query).filter((query) => query.includes('FROM change_event'));
}

async function pollUntilQuiet(resourceType: string, store: ReturnType<typeof memoryStore>, maxPolls: number) {
  const polls: string[][] = [];
  let quiet = 0;
  for (let i = 0; i < maxPolls; i++) {
    const fired = firedNames(await newRecord.run(triggerContext(resourceType, store)));
    expect(JSON.stringify(store.data.get(EVENTS_KEY)).length).toBeLessThan(512 * 1024);
    quiet = fired.length === 0 && store.data.get(EVENTS_KEY) !== undefined && !('boundary' in (store.data.get(EVENTS_KEY) as object)) ? quiet + 1 : 0;
    if (quiet === 2) {
      return polls;
    }
    if (fired.length > 0) {
      polls.push(fired);
    }
  }
  return polls;
}

describe('newRecord', () => {
  beforeEach(() => {
    search.mockReset();
    searchAll.mockReset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-07T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be a polling trigger', () => {
    expect(newRecord.type).toBe('POLLING');
  });

  describe('records with account-unique ids', () => {
    it('should save the newest id as the baseline on enable', async () => {
      search.mockResolvedValue({ results: [{ campaign: { id: '500' } }] });
      const store = memoryStore();

      await newRecord.onEnable(triggerContext('campaign', store));

      expect(search).toHaveBeenCalledWith({
        auth: AUTH,
        customerId: '1234567890',
        query: expect.stringMatching(/FROM campaign WHERE campaign\.status != 'REMOVED' ORDER BY campaign\.id DESC LIMIT 1$/),
      });
      expect(store.data.get(KEY)).toBe('500');
    });

    it('should use 0 as the baseline for an empty account', async () => {
      search.mockResolvedValue({ results: [] });
      const store = memoryStore();

      await newRecord.onEnable(triggerContext('campaign', store));

      expect(store.data.get(KEY)).toBe('0');
    });

    it('should fetch every record above the saved id in ascending order and move the checkpoint', async () => {
      const rows = Array.from({ length: 150 }, (_, i) => ({ adGroup: { id: String(1001 + i) }, status: 'ENABLED' }));
      searchAll.mockResolvedValue({ results: rows, truncated: false });
      const store = memoryStore({ [KEY]: '1000' });

      const output = await newRecord.run(triggerContext('ad_group', store));

      expect(searchAll).toHaveBeenCalledWith({
        auth: AUTH,
        customerId: '1234567890',
        query: expect.stringMatching(/FROM ad_group WHERE ad_group\.status != 'REMOVED' AND ad_group\.id > 1000 ORDER BY ad_group\.id ASC$/),
        maxRows: 1000,
      });
      expect(output).toHaveLength(150);
      expect(store.data.get(KEY)).toBe('1150');
    });

    it('should continue after a truncated page from the last returned id without losing or repeating records', async () => {
      const ids = Array.from({ length: 1_500 }, (_, i) => 2001 + i);
      searchAll.mockImplementation(async ({ query, maxRows = 10_000 }) => {
        const after = Number(/user_list\.id > (\d+)/.exec(query)?.[1]);
        const above = ids.filter((id) => id > after);
        return { results: above.slice(0, maxRows).map((id) => ({ userList: { id: String(id) } })), truncated: above.length > maxRows };
      });
      const store = memoryStore({ [KEY]: '2000' });

      const first = await newRecord.run(triggerContext('user_list', store));
      const second = await newRecord.run(triggerContext('user_list', store));
      const third = await newRecord.run(triggerContext('user_list', store));

      expect(first).toHaveLength(1_000);
      expect(second).toHaveLength(500);
      expect(third).toEqual([]);
      const fired = [...(first as Array<{ userList: { id: string } }>), ...(second as Array<{ userList: { id: string } }>)].map((row) => Number(row.userList.id));
      expect(fired).toEqual(ids);
    });

    it('should keep the checkpoint when nothing new was created, even if the last seen record was removed', async () => {
      searchAll.mockResolvedValue({ results: [], truncated: false });
      const store = memoryStore({ [KEY]: '1000' });

      const output = await newRecord.run(triggerContext('campaign', store));

      expect(output).toEqual([]);
      expect(store.data.get(KEY)).toBe('1000');
    });

    it('should set a baseline instead of firing when no checkpoint exists', async () => {
      search.mockResolvedValue({ results: [{ campaign: { id: '42' } }] });
      const store = memoryStore();

      const output = await newRecord.run(triggerContext('campaign', store));

      expect(output).toEqual([]);
      expect(searchAll).not.toHaveBeenCalled();
      expect(store.data.get(KEY)).toBe('42');
    });

    it('should reject a non-numeric checkpoint', async () => {
      await expect(newRecord.run(triggerContext('campaign', memoryStore({ [KEY]: '1 OR 1=1' })))).rejects.toThrow('Invalid checkpoint id');
    });
  });

  describe('keywords and ads', () => {
    it('should baseline from the change history on enable so existing keywords do not fire', async () => {
      const account = fakeAccount();
      account.add({ id: '1~0~0', time: '2026-10-01 09:00:00.000000', target: '111~500' });
      account.add({ id: '2~0~0', time: '2026-10-07 11:55:00.000000', target: '111~600' });
      const store = memoryStore();

      await enableBeforePolling('ad_group_criterion', store);
      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(searchAll.mock.calls[0][0].query).toBe(
        "SELECT change_event.resource_name, change_event.change_date_time, change_event.change_resource_name, ad_group.id FROM change_event WHERE change_event.change_date_time > '2026-09-08' AND change_event.change_date_time <= '2026-10-09' AND change_event.change_resource_type = 'AD_GROUP_CRITERION' AND change_event.resource_change_operation = 'CREATE' ORDER BY change_event.change_date_time DESC, ad_group.id DESC LIMIT 5000"
      );
      expect(output).toEqual([]);
      expect(recordQueries()).toEqual([]);
      expect(store.data.has(KEY)).toBe(false);
    });

    it('should fire a keyword added to another ad group even when its criterion id was already seen', async () => {
      const account = fakeAccount();
      account.add({ id: '1~0~0', time: '2026-10-07 11:00:00.000000', target: '111~500' });
      account.add({ id: '2~0~0', time: '2026-10-07 11:30:00.000000', target: '111~900' });
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);

      account.add({ id: '3~0~0', time: '2026-10-07 11:58:00.000000', target: '222~500' });
      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(output)).toEqual(['222~500']);
      expect(recordQueries()).toEqual([expect.stringMatching(/, ad_group_criterion\.type FROM ad_group_criterion WHERE ad_group_criterion\.resource_name IN \('customers\/1234567890\/adGroupCriteria\/222~500'\)$/)]);
    });

    it('should never replay a keyword that already fired', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:59:00.000000', target: '111~500' });

      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(first)).toEqual(['111~500']);
      expect(second).toEqual([]);
    });

    it('should fire a creation that shows up late in the change history exactly once', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '2~0~0', time: '2026-10-07 11:59:00.000000', target: '111~2' });
      const first = await newRecord.run(triggerContext('ad_group_criterion', store));

      account.add({ id: '1~0~0', time: '2026-10-07 11:57:00.000000', target: '111~1' });
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      const third = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(first)).toEqual(['111~2']);
      expect(firedNames(second)).toEqual(['111~1']);
      expect(third).toEqual([]);
    });

    it('should never fire a creation made before the trigger was enabled that shows up late in the change history', async () => {
      const account = fakeAccount();
      account.add({ id: '1~0~0', time: '2026-10-07 10:40:00.000000', target: '111~1' });
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);

      account.add({ id: '2~0~0', time: '2026-10-07 10:55:00.000000', target: '111~2' });
      account.hide('111~2');
      account.add({ id: '3~0~0', time: '2026-10-07 11:05:00.000000', target: '111~3' });
      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(store.data.get(EVENTS_KEY)).toMatchObject({ enabledAt: '2026-10-07 11:00:00' });
      expect(firedNames(first)).toEqual(['111~3']);
      expect(second).toEqual([]);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
      expect(recordQueries().some((query) => query.includes('111~2'))).toBe(false);
    });

    it('should fire a creation made after the trigger was enabled that shows up late within the overlap exactly once', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '2~0~0', time: '2026-10-07 11:30:00.000000', target: '111~2' });
      const first = await newRecord.run(triggerContext('ad_group_criterion', store));

      account.add({ id: '1~0~0', time: '2026-10-07 11:25:00.000000', target: '111~1' });
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      const third = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(first)).toEqual(['111~2']);
      expect(firedNames(second)).toEqual(['111~1']);
      expect(third).toEqual([]);
      expect(store.data.get(EVENTS_KEY)).toMatchObject({ floor: '2026-10-07 11:20:00', enabledAt: '2026-10-07 11:00:00' });
    });

    it('should not fire 29 day old creations that show up after enabling an account with no change history', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const baseline = store.data.get(EVENTS_KEY);

      account.add({ id: '1~0~0', time: '2026-09-08 10:00:00.000000', target: '111~1' });
      account.add({ id: '2~0~0', time: '2026-10-06 23:59:59.000000', target: '111~2' });
      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(baseline).toEqual({ floor: '2026-09-08', seen: [], enabledAt: '2026-10-07 11:00:00' });
      expect(eventQueries()[1]).toContain("change_event.change_date_time > '2026-09-08'");
      expect(output).toEqual([]);
      expect(recordQueries()).toEqual([]);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
    });

    it('should compare the activation time in the time zone of the account', async () => {
      const account = fakeAccount();
      account.setTimeZone('America/Sao_Paulo');
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
      account.add({ id: '1~0~0', time: '2026-10-07 08:59:00.000000', target: '111~1' });
      account.add({ id: '2~0~0', time: '2026-10-07 09:01:00.000000', target: '111~2' });

      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(search).toHaveBeenCalledWith({ auth: AUTH, customerId: '1234567890', query: 'SELECT customer.time_zone FROM customer LIMIT 1' });
      expect(store.data.get(EVENTS_KEY)).toMatchObject({ enabledAt: '2026-10-07 09:00:00' });
      expect(firedNames(output)).toEqual(['111~2']);
    });

    it('should refuse to enable when the account time zone is unknown', async () => {
      fakeAccount();
      search.mockResolvedValue({ results: [] });
      const store = memoryStore();

      await expect(newRecord.onEnable(triggerContext('ad_group_criterion', store))).rejects.toThrow('Google Ads did not return the time zone of account 1234567890');
      expect(store.data.has(EVENTS_KEY)).toBe(false);
    });

    it('should not lose creations that share a timestamp across the page boundary', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      for (let i = 0; i < 9_998; i++) {
        account.add({ id: `a~0~${i}`, time: '2026-10-07 11:58:00.000000', target: `111~${i}` });
      }
      for (let i = 0; i < 7; i++) {
        account.add({ id: `b~0~${i}`, time: '2026-10-07 11:59:00.000000', target: `222~${i}` });
      }

      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      const third = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(first).toHaveLength(10_000);
      expect(second).toHaveLength(5);
      expect(firedNames(second).every((name) => name.startsWith('222~'))).toBe(true);
      expect(third).toEqual([]);
      expect(new Set([...firedNames(first), ...firedNames(second)]).size).toBe(10_005);
    });

    it('should keep the stored state bounded', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      for (let i = 0; i < 9_000; i++) {
        const second = String(i % 60).padStart(2, '0');
        const minute = String(50 + Math.floor(i / 1_000)).padStart(2, '0');
        account.add({ id: `${i}~0~0`, time: `2026-10-07 11:${minute}:${second}.000000`, target: `${i}~1` });
      }
      account.add({ id: 'old~0~0', time: '2026-10-07 09:00:00.000000', target: '1~1' });

      await newRecord.run(triggerContext('ad_group_criterion', store));
      const state = store.data.get(EVENTS_KEY) as { floor: string; seen: Array<{ time: string; ids: string[] }> };

      expect(state.seen.reduce((total, group) => total + group.ids.length, 0)).toBeLessThanOrEqual(SEEN_CAP);
      expect(state.seen.every((group) => group.time > state.floor)).toBe(true);
      expect(JSON.stringify(state).length).toBeLessThan(512 * 1024);
      expect(state.seen.some((group) => group.time.startsWith('2026-10-07 09'))).toBe(false);
    });

    it('should fire every creation of a bulk import that shares one timestamp exactly once across several polls', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const bulkTime = '2026-10-07 11:58:00.123456';
      const expected: string[] = [];
      for (let i = 0; i < 25_003; i++) {
        const target = `${1_000 + Math.floor(i / 499)}~${i}`;
        account.add({ id: `1759838280123456~${Math.floor(i / 10_000)}~${i % 10_000}`, time: bulkTime, target });
        expected.push(target);
      }

      const polls = await pollUntilQuiet('ad_group_criterion', store, 10);

      const fired = polls.flat();
      expect(polls.length).toBeGreaterThanOrEqual(3);
      expect(fired).toHaveLength(25_003);
      expect(new Set(fired).size).toBe(25_003);
      expect(new Set(fired)).toEqual(new Set(expected));
      const boundaryQueries = eventQueries().filter((query) => query.includes(`change_event.change_date_time >= '${bulkTime}' AND change_event.change_date_time <= '${bulkTime}'`));
      expect(boundaryQueries.length).toBeGreaterThanOrEqual(2);
      expect(boundaryQueries.every((query) => /AND ad_group\.id >= \d+ ORDER BY ad_group\.id ASC LIMIT 10000$/.test(query))).toBe(true);
      expect(eventQueries().at(-1)).toContain(`change_event.change_date_time > '${bulkTime}'`);
      const state = store.data.get(EVENTS_KEY) as { floor: string; seen: Array<{ time: string; ids: string[] }>; boundary?: unknown };
      expect(state.floor).toBe(bulkTime);
      expect(state.boundary).toBeUndefined();
      expect(state.seen.reduce((total, group) => total + group.ids.length, 0)).toBeLessThanOrEqual(SEEN_CAP);
    });

    it('should page through a bulk import at the boundary and then continue with normal paging', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const expected: string[] = [];
      const add = ({ id, time, target }: FakeEvent) => {
        account.add({ id, time, target });
        expected.push(target);
      };
      for (let i = 0; i < 3_000; i++) {
        add({ id: `before~0~${i}`, time: `2026-10-07 11:50:${String(i % 60).padStart(2, '0')}.000000`, target: `${10 + (i % 7)}~${i}` });
      }
      for (let i = 0; i < 12_500; i++) {
        add({ id: `bulk~0~${i}`, time: '2026-10-07 11:55:00.000000', target: `${20 + Math.floor(i / 2_500)}~${i}` });
      }
      for (let i = 0; i < 40; i++) {
        add({ id: `after~0~${i}`, time: '2026-10-07 11:57:30.000000', target: `30~${i}` });
      }

      const polls = await pollUntilQuiet('ad_group_criterion', store, 10);
      account.add({ id: 'later~0~0', time: '2026-10-07 11:59:00.000000', target: '40~1' });
      const later = firedNames(await newRecord.run(triggerContext('ad_group_criterion', store)));
      const final = await newRecord.run(triggerContext('ad_group_criterion', store));

      const fired = polls.flat();
      expect(polls[0]).toHaveLength(10_000);
      expect(fired).toHaveLength(expected.length);
      expect(new Set(fired)).toEqual(new Set(expected));
      expect(later).toEqual(['40~1']);
      expect(final).toEqual([]);
      const state = store.data.get(EVENTS_KEY) as { floor: string; seen: Array<{ time: string; ids: string[] }> };
      expect(state.floor).toBe('2026-10-07 11:55:00.000000');
      expect(state.seen.flatMap((group) => group.ids)).toContain(seenKey('later~0~0'));
    });

    it('should not replay creations at the boundary timestamp that an earlier poll already fired', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const boundaryTime = '2026-10-07 11:58:00.000000';
      for (let i = 0; i < 30; i++) {
        account.add({ id: `early~0~${i}`, time: boundaryTime, target: `${500 + (i % 3)}~${i}` });
      }
      const first = firedNames(await newRecord.run(triggerContext('ad_group_criterion', store)));
      for (let i = 0; i < 9_990; i++) {
        account.add({ id: `late~0~${i}`, time: '2026-10-07 11:57:00.000000', target: `400~${i}` });
      }

      const rest = (await pollUntilQuiet('ad_group_criterion', store, 5)).flat();

      expect(first).toHaveLength(30);
      expect(rest).toHaveLength(9_990);
      expect(new Set([...first, ...rest]).size).toBe(10_020);
    });

    it('should keep the overlap after draining a full page so late creations at or before the boundary timestamp fire exactly once', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const boundaryTime = '2026-10-07 11:55:00.000000';
      for (let i = 0; i < 6_000; i++) {
        account.add({ id: `old~0~${i}`, time: '2026-10-07 11:40:00.000000', target: `100~${i}` });
      }
      for (let i = 0; i < 3_000; i++) {
        account.add({ id: `mid~0~${i}`, time: '2026-10-07 11:52:00.000000', target: `200~${i}` });
      }
      for (let i = 0; i < 1_500; i++) {
        account.add({ id: `edge~0~${i}`, time: boundaryTime, target: `${300 + Math.floor(i / 500)}~${i}` });
      }

      const polls = await pollUntilQuiet('ad_group_criterion', store, 5);
      account.add({ id: 'late~0~0', time: boundaryTime, target: '300~99999' });
      account.add({ id: 'late~0~1', time: '2026-10-07 11:50:00.000000', target: '250~99999' });
      const late = firedNames(await newRecord.run(triggerContext('ad_group_criterion', store)));
      const after = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(polls.map((poll) => poll.length)).toEqual([10_000, 500]);
      expect(new Set(polls.flat()).size).toBe(10_500);
      expect(eventQueries().some((query) => query.includes(`change_event.change_date_time >= '${boundaryTime}'`))).toBe(true);
      expect(late.sort()).toEqual(['250~99999', '300~99999']);
      expect(after).toEqual([]);
      const state = store.data.get(EVENTS_KEY) as { floor: string; seen: Array<{ time: string; ids: string[] }> };
      expect(state.floor).toBe('2026-10-07 11:45:00');
      expect(state.seen.reduce((total, group) => total + group.ids.length, 0)).toBeLessThanOrEqual(SEEN_CAP);
      expect(JSON.stringify(state).length).toBeLessThan(512 * 1024);
    });

    it.each([6_000, 9_000])('should keep the overlap after one poll reads %i creations at one timestamp so late creations fire exactly once', async (count) => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const batchTime = '2026-10-07 11:55:00.000000';
      for (let i = 0; i < count; i++) {
        account.add({ id: `1759838100000000~0~${i}`, time: batchTime, target: `${800 + Math.floor(i / 2_000)}~${i}` });
      }

      const batch = (await pollUntilQuiet('ad_group_criterion', store, 6)).flat();
      const settled = store.data.get(EVENTS_KEY) as { floor: string; seen: Array<{ time: string; ids: string[] }> };
      account.add({ id: 'late~0~0', time: batchTime, target: '804~99999' });
      account.add({ id: 'late~0~1', time: '2026-10-07 11:50:00.000000', target: '799~99999' });
      const late = (await pollUntilQuiet('ad_group_criterion', store, 6)).flat();
      const after = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(batch).toHaveLength(count);
      expect(new Set(batch).size).toBe(count);
      expect(settled.floor).toBe('2026-10-07 11:45:00');
      expect(settled.seen.reduce((total, group) => total + group.ids.length, 0)).toBe(count);
      expect(late.sort()).toEqual(['799~99999', '804~99999']);
      expect(after).toEqual([]);
      expect(JSON.stringify(store.data.get(EVENTS_KEY)).length).toBeLessThan(512 * 1024);
    });

    it('should keep the largest state it can store well under the 512 KB store limit', () => {
      const key = (i: number) => seenKey(`${1759838100000000 + i * 1_000}~${Math.floor(i / 10_000)}~${i % 10_000}`);
      const seconds = OVERLAP_MINUTES * 60 + 1;
      const seen = Array.from({ length: seconds }, (_, second) => ({
        time: `2026-10-07 11:${String(45 + Math.floor(second / 60)).padStart(2, '0')}:${String(second % 60).padStart(2, '0')}`,
        ids: Array.from({ length: Math.ceil(SEEN_CAP / seconds) }, (_, i) => key(second * 1_000 + i)),
      }));
      const boundaryIds = Array.from({ length: MAX_BOUNDARY_IDS }, (_, i) => key(1_000_000 + i));
      const boundary = { time: '2026-10-07 11:55:00.123456', adGroupId: '9223372036854775807', ids: boundaryIds, replay: true };
      const pending = Array.from({ length: 1_000 }, (_, i) => ({ id: `9223372036854775807~${9223372036854775000n + BigInt(i)}`, at: 1759838400000 + i }));
      const state = { floor: '2026-10-07 11:45:00', seen, boundary, enabledAt: '2026-10-07 11:00:00' };

      expect(seen.reduce((total, group) => total + group.ids.length, 0)).toBeGreaterThanOrEqual(SEEN_CAP);
      expect(SEEN_CAP).toBeGreaterThanOrEqual(2 * EVENTS_PER_POLL);
      expect(JSON.stringify(state).length).toBeLessThan(450 * 1024);
      expect(JSON.stringify({ ...state, pending }).length).toBeLessThan(500 * 1024);
    });

    it.each([0, 2_500])('should fire all 10,000 creations of one mutate request in one ad group at one instant exactly once after %i earlier creations', async (earlier) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const bulkTime = '2026-10-07 11:58:00.123456';
      const expected: string[] = [];
      const add = ({ id, time, target }: FakeEvent) => {
        account.add({ id, time, target });
        expected.push(target);
      };
      for (let i = 0; i < earlier; i++) {
        add({ id: `earlier~0~${i}`, time: '2026-10-07 11:57:00.000000', target: `600~${i}` });
      }
      for (let i = 0; i < 10_000; i++) {
        add({ id: `1759838280123456~0~${i}`, time: bulkTime, target: `700~${i}` });
      }
      for (let i = 0; i < 4; i++) {
        add({ id: `next~0~${i}`, time: bulkTime, target: `701~${i}` });
      }
      add({ id: 'after~0~0', time: '2026-10-07 11:59:00.000000', target: '702~1' });

      const fired = (await pollUntilQuiet('ad_group_criterion', store, 10)).flat();
      account.add({ id: 'later~0~0', time: '2026-10-07 11:59:30.000000', target: '703~1' });
      const later = firedNames(await newRecord.run(triggerContext('ad_group_criterion', store)));

      expect(fired).toHaveLength(expected.length);
      expect(new Set(fired)).toEqual(new Set(expected));
      expect(later).toEqual(['703~1']);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(`ad group 700 has at least 10000 creations at ${bulkTime}`);
      warn.mockRestore();
    });

    it('should drop only the creations beyond the 10,000 row limit of one ad group at one instant, warn, and keep polling', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const bulkTime = '2026-10-07 11:58:00.000000';
      const huge: FakeEvent[] = [];
      for (let i = 0; i < 10_003; i++) {
        huge.push({ id: `1759838280000000~${Math.floor(i / 10_000)}~${i % 10_000}`, time: bulkTime, target: `700~${i}` });
      }
      huge.forEach((event) => account.add(event));
      for (let i = 0; i < 4; i++) {
        account.add({ id: `next~0~${i}`, time: bulkTime, target: `701~${i}` });
      }
      account.add({ id: 'after~0~0', time: '2026-10-07 11:59:00.000000', target: '702~1' });
      const lost = [...huge].sort(compareFakeEvents).slice(10_000).map((event) => event.target);

      const fired = (await pollUntilQuiet('ad_group_criterion', store, 10)).flat();
      account.add({ id: 'later~0~0', time: '2026-10-07 11:59:30.000000', target: '703~1' });
      const later = firedNames(await newRecord.run(triggerContext('ad_group_criterion', store)));

      const expected = [...huge.map((event) => event.target).filter((target) => !lost.includes(target)), '701~0', '701~1', '701~2', '701~3', '702~1'];
      expect(lost).toHaveLength(3);
      expect(fired).toHaveLength(expected.length);
      expect(new Set(fired)).toEqual(new Set(expected));
      expect(fired.some((name) => lost.includes(name))).toBe(false);
      expect(later).toEqual(['703~1']);
      expect(eventQueries().some((query) => query.includes('AND ad_group.id >= 701 '))).toBe(true);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(`ad group 700 has at least 10000 creations at ${bulkTime}`);
      warn.mockRestore();
    });

    it('should leave a boundary that fell out of the 30 day window and resume normal paging', async () => {
      fakeAccount();
      const store = memoryStore({
        [EVENTS_KEY]: { floor: '2026-07-01 00:00:00', seen: [], boundary: { time: '2026-08-01 10:00:00.000000', adGroupId: '5', ids: ['x~0~0'] } },
      });

      await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(searchAll.mock.calls[0][0].query).toContain("change_event.change_date_time > '2026-09-08'");
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('boundary');
    });

    it('should reject a stored boundary that is not a strict timestamp or ad group id', async () => {
      fakeAccount();
      const badTime = memoryStore({ [EVENTS_KEY]: { floor: '2026-10-07', seen: [], boundary: { time: "2026-10-07' OR '1'='1", adGroupId: '5', ids: [] } } });
      const badGroup = memoryStore({ [EVENTS_KEY]: { floor: '2026-10-07', seen: [], boundary: { time: '2026-10-07 10:00:00', adGroupId: '5 OR 1=1', ids: [] } } });

      await expect(newRecord.run(triggerContext('ad_group_criterion', badTime))).rejects.toThrow('Invalid change event time');
      await expect(newRecord.run(triggerContext('ad_group_criterion', badGroup))).rejects.toThrow('Invalid ad group id');
      expect(searchAll).not.toHaveBeenCalled();
    });

    it('should skip keywords that were removed before the poll', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:58:00.000000', target: '111~1' });
      account.add({ id: '2~0~0', time: '2026-10-07 11:59:00.000000', target: '111~2' });
      account.remove('111~1');

      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(output)).toEqual(['111~2']);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
    });

    it('should retry a keyword that is not readable yet and fire it exactly once when it becomes readable', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:58:00.000000', target: '111~1' });
      account.hide('111~1');

      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      const pending = store.data.get(EVENTS_KEY);
      account.show('111~1');
      account.add({ id: '2~0~0', time: '2026-10-07 11:59:00.000000', target: '111~2' });
      vi.setSystemTime(new Date('2026-10-07T12:05:00Z'));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      vi.setSystemTime(new Date('2026-10-07T12:10:00Z'));
      const third = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(first).toEqual([]);
      expect(pending).toHaveProperty('pending', [{ id: '111~1', at: Date.parse('2026-10-07T12:00:00Z') }]);
      expect(firedNames(second)).toEqual(['111~1', '111~2']);
      expect(third).toEqual([]);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
    });

    it('should drop a keyword that never becomes readable after the 30 minute retry window', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:58:00.000000', target: '111~1' });
      account.hide('111~1');

      const polls: unknown[] = [];
      for (let minute = 0; minute <= 30; minute += 5) {
        vi.setSystemTime(new Date(Date.parse('2026-10-07T12:00:00Z') + minute * 60_000));
        polls.push(await newRecord.run(triggerContext('ad_group_criterion', store)));
        expect((store.data.get(EVENTS_KEY) as { pending?: unknown[] }).pending ?? []).toHaveLength(minute < 30 ? 1 : 0);
      }
      const queriesBefore = recordQueries().length;
      account.show('111~1');
      vi.setSystemTime(new Date('2026-10-07T12:35:00Z'));
      const after = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(polls.every((output) => Array.isArray(output) && output.length === 0)).toBe(true);
      expect(recordQueries().slice(0, queriesBefore).every((query) => query.includes('111~1'))).toBe(true);
      expect(after).toEqual([]);
      expect(recordQueries()).toHaveLength(queriesBefore);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
    });

    it('should not retry a keyword that was removed before it could fire', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:58:00.000000', target: '111~1' });
      account.hide('111~1');
      await newRecord.run(triggerContext('ad_group_criterion', store));
      account.show('111~1');
      account.remove('111~1');

      vi.setSystemTime(new Date('2026-10-07T12:05:00Z'));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      vi.setSystemTime(new Date('2026-10-07T12:10:00Z'));
      const third = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(second).toEqual([]);
      expect(third).toEqual([]);
      expect(recordQueries()).toHaveLength(2);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
    });

    it('should drop a criterion that is not a keyword at once, without retrying or firing it', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:58:00.000000', target: '111~1' });
      account.add({ id: '2~0~0', time: '2026-10-07 11:59:00.000000', target: '111~2' });
      account.placement('111~1');

      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      vi.setSystemTime(new Date('2026-10-07T12:05:00Z'));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(first)).toEqual(['111~2']);
      expect(second).toEqual([]);
      expect(recordQueries()).toHaveLength(1);
      expect(store.data.get(EVENTS_KEY)).not.toHaveProperty('pending');
    });

    it('should keep at most 1,000 unreadable keywords for retry and leave the rest unseen so a later poll reads them again', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const targets = Array.from({ length: 1_200 }, (_, i) => `111~${i}`);
      targets.forEach((target, i) => {
        account.add({ id: `${i}~0~0`, time: '2026-10-07 11:58:00.000000', target });
        account.hide(target);
      });

      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      const afterFirst = store.data.get(EVENTS_KEY) as { pending: Array<{ id: string; at: number }>; seen: Array<{ ids: string[] }>; boundary?: { ids: string[] } };
      vi.setSystemTime(new Date('2026-10-07T12:05:00Z'));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      const afterSecond = store.data.get(EVENTS_KEY) as { pending: Array<{ id: string; at: number }> };
      targets.forEach((target) => account.show(target));
      vi.setSystemTime(new Date('2026-10-07T12:10:00Z'));
      const rest = (await pollUntilQuiet('ad_group_criterion', store, 6)).flat();
      account.add({ id: 'later~0~0', time: '2026-10-07 12:09:00.000000', target: '222~1' });
      const later = firedNames(await newRecord.run(triggerContext('ad_group_criterion', store)));

      const marked = new Set([...afterFirst.seen.flatMap((group) => group.ids), ...(afterFirst.boundary?.ids ?? [])]);
      const pendingIds = new Set(afterFirst.pending.map((record) => record.id));
      const unmarked = targets.map((target, i) => ({ target, key: seenKey(`${i}~0~0`) })).filter(({ key }) => !marked.has(key));
      expect(first).toEqual([]);
      expect(afterFirst.pending).toHaveLength(1_000);
      expect(unmarked).toHaveLength(200);
      expect(unmarked.some(({ target }) => pendingIds.has(target))).toBe(false);
      expect(second).toEqual([]);
      expect(afterSecond.pending).toEqual(afterFirst.pending);
      expect(rest).toHaveLength(1_200);
      expect(new Set(rest)).toEqual(new Set(targets));
      expect(later).toEqual(['222~1']);
      expect((store.data.get(EVENTS_KEY) as { pending?: unknown[] }).pending).toBeUndefined();
    });

    it('should fire every record of a mixed bulk import whose unreadable records overflow the retry list exactly once', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      const targets: string[] = [];
      for (let i = 0; i < 3_000; i++) {
        const target = `${100 + (i % 5)}~${i}`;
        account.add({ id: `mix~0~${i}`, time: `2026-10-07 11:${String(50 + Math.floor(i / 400)).padStart(2, '0')}:00.000000`, target });
        targets.push(target);
        if (i % 3 !== 0) {
          account.hide(target);
        }
      }

      const fired: string[] = [];
      const pendingSizes: number[] = [];
      for (let minute = 0; minute <= 10; minute += 5) {
        vi.setSystemTime(new Date(Date.parse('2026-10-07T12:00:00Z') + minute * 60_000));
        fired.push(...firedNames(await newRecord.run(triggerContext('ad_group_criterion', store))));
        pendingSizes.push(((store.data.get(EVENTS_KEY) as { pending?: unknown[] }).pending ?? []).length);
        expect(JSON.stringify(store.data.get(EVENTS_KEY)).length).toBeLessThan(512 * 1024);
      }
      const readableFirst = fired.length;
      targets.forEach((target) => account.show(target));
      vi.setSystemTime(new Date('2026-10-07T12:15:00Z'));
      fired.push(...(await pollUntilQuiet('ad_group_criterion', store, 8)).flat());

      expect(pendingSizes.every((size) => size === 1_000)).toBe(true);
      expect(readableFirst).toBeGreaterThan(0);
      expect(readableFirst).toBeLessThan(1_000);
      expect(fired).toHaveLength(3_000);
      expect(new Set(fired)).toEqual(new Set(targets));
      expect((store.data.get(EVENTS_KEY) as { pending?: unknown[] }).pending).toBeUndefined();
    });

    it('should keep the stored state under the 512 KB store limit while the retry list is full', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await enableBeforePolling('ad_group_criterion', store);
      for (let i = 0; i < 9_999; i++) {
        const target = `9223372036854775807~${9223372036854770000n + BigInt(i)}`;
        account.add({ id: `1759838280123456~${Math.floor(i / 10_000)}~${i}`, time: '2026-10-07 11:58:00.123456', target });
        account.hide(target);
      }

      await newRecord.run(triggerContext('ad_group_criterion', store));
      const state = store.data.get(EVENTS_KEY) as { pending: unknown[] };

      expect(state.pending).toHaveLength(1_000);
      expect(JSON.stringify(state).length).toBeLessThan(512 * 1024);
    });

    it('should detect new ads the same way', async () => {
      const account = fakeAccount('adGroupAds');
      const store = memoryStore();
      await enableBeforePolling('ad_group_ad', store);
      account.add({ id: '1~0~0', time: '2026-10-07 11:59:00.000000', target: '333~77' });

      const output = await newRecord.run(triggerContext('ad_group_ad', store));

      expect(searchAll.mock.calls[0][0].query).toContain("change_event.change_resource_type = 'AD_GROUP_AD'");
      expect(firedNames(output)).toEqual(['333~77']);
    });

    it('should never ask for change history older than 30 days', async () => {
      fakeAccount();
      const store = memoryStore({ [EVENTS_KEY]: { floor: '2026-07-01 00:00:00', seen: [] } });

      await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(searchAll.mock.calls[0][0].query).toContain("change_event.change_date_time > '2026-09-08'");
    });

    it('should set a baseline instead of firing when no state exists', async () => {
      const account = fakeAccount();
      account.add({ id: '1~0~0', time: '2026-10-07 11:59:00.000000', target: '111~1' });
      const store = memoryStore();

      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(output).toEqual([]);
      expect(store.data.has(EVENTS_KEY)).toBe(true);
    });
  });

  it('should clear the checkpoints on disable', async () => {
    const store = memoryStore({ [KEY]: '42', [EVENTS_KEY]: { floor: '2026-10-07', seen: [] } });

    await newRecord.onDisable(triggerContext('campaign', store));

    expect(store.data.has(KEY)).toBe(false);
    expect(store.data.has(EVENTS_KEY)).toBe(false);
  });

  it('should return the newest records as test data', async () => {
    search.mockResolvedValue({ results: [{ campaign: { id: '3' } }, { campaign: { id: '2' } }] });

    const output = await newRecord.test(triggerContext('campaign', memoryStore()));

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ query: expect.stringMatching(/ORDER BY campaign\.id DESC LIMIT 5$/) }));
    expect(output).toHaveLength(2);
  });

  it('should keep the newest keywords as test data', async () => {
    search.mockResolvedValue({ results: [] });

    await newRecord.test(triggerContext('ad_group_criterion', memoryStore()));

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ query: expect.stringMatching(/ORDER BY ad_group_criterion\.criterion_id DESC LIMIT 5$/) }));
  });
});
