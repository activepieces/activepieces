import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const search = vi.fn<(params: { query: string }) => Promise<unknown>>();
const searchAll = vi.fn<(params: { query: string; maxRows?: number }) => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { search, searchAll } };
});

const { newRecord } = await import('../../../src/lib/triggers/new-record');
const { SEEN_CAP } = await import('../../../src/lib/common/change-events');

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

function fakeAccount(collection: 'adGroupCriteria' | 'adGroupAds' = 'adGroupCriteria') {
  const events: FakeEvent[] = [];
  const removed = new Set<string>();
  searchAll.mockImplementation(async ({ query }) => {
    if (query.includes('FROM change_event')) {
      const after = /change_date_time > '([^']+)'/.exec(query)?.[1] ?? '';
      const limit = Number(/LIMIT (\d+)$/.exec(query)?.[1]);
      const matching = events.filter((event) => event.time > after).sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
      const ordered = query.includes(' DESC ') ? matching.reverse() : matching;
      const results = ordered.slice(0, limit).map((event) => ({
        changeEvent: {
          resourceName: `${CID}/changeEvents/${event.id}`,
          changeDateTime: event.time,
          changeResourceName: `${CID}/${collection}/${event.target}`,
        },
      }));
      return { results, truncated: false };
    }
    const names = [...query.matchAll(/'(customers\/[^']+)'/g)].map((match) => match[1]).filter((name) => !removed.has(name));
    const key = collection === 'adGroupCriteria' ? 'adGroupCriterion' : 'adGroupAd';
    return { results: names.map((resourceName) => ({ [key]: { resourceName } })), truncated: false };
  });
  return {
    add: (event: FakeEvent) => events.push(event),
    remove: (target: string) => removed.add(`${CID}/${collection}/${target}`),
  };
}

function firedNames(output: unknown): string[] {
  return (output as Array<Record<string, { resourceName: string }>>).map((row) => Object.values(row)[0].resourceName.split('/').pop() ?? '');
}

function recordQueries(): string[] {
  return searchAll.mock.calls.map(([params]) => params.query).filter((query) => !query.includes('FROM change_event'));
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

      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(searchAll.mock.calls[0][0].query).toBe(
        "SELECT change_event.resource_name, change_event.change_date_time, change_event.change_resource_name FROM change_event WHERE change_event.change_date_time > '2026-09-08' AND change_event.change_date_time <= '2026-10-09' AND change_event.change_resource_type = 'AD_GROUP_CRITERION' AND change_event.resource_change_operation = 'CREATE' ORDER BY change_event.change_date_time DESC LIMIT 5000"
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
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));

      account.add({ id: '3~0~0', time: '2026-10-07 11:58:00.000000', target: '222~500' });
      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(output)).toEqual(['222~500']);
      expect(recordQueries()).toEqual([expect.stringMatching(/WHERE ad_group_criterion\.type = 'KEYWORD' AND ad_group_criterion\.status != 'REMOVED' AND ad_group_criterion\.resource_name IN \('customers\/1234567890\/adGroupCriteria\/222~500'\)$/)]);
    });

    it('should never replay a keyword that already fired', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
      account.add({ id: '1~0~0', time: '2026-10-07 11:59:00.000000', target: '111~500' });

      const first = await newRecord.run(triggerContext('ad_group_criterion', store));
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(first)).toEqual(['111~500']);
      expect(second).toEqual([]);
    });

    it('should fire a creation that shows up late in the change history exactly once', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
      account.add({ id: '2~0~0', time: '2026-10-07 11:59:00.000000', target: '111~2' });
      const first = await newRecord.run(triggerContext('ad_group_criterion', store));

      account.add({ id: '1~0~0', time: '2026-10-07 11:57:00.000000', target: '111~1' });
      const second = await newRecord.run(triggerContext('ad_group_criterion', store));
      const third = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(first)).toEqual(['111~2']);
      expect(firedNames(second)).toEqual(['111~1']);
      expect(third).toEqual([]);
    });

    it('should not lose creations that share a timestamp across the page boundary', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
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
      expect(firedNames(second)).toEqual(['222~2', '222~3', '222~4', '222~5', '222~6']);
      expect(third).toEqual([]);
      expect(new Set([...firedNames(first), ...firedNames(second)]).size).toBe(10_005);
    });

    it('should keep the stored state bounded', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
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

    it('should skip keywords that were removed before the poll', async () => {
      const account = fakeAccount();
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_criterion', store));
      account.add({ id: '1~0~0', time: '2026-10-07 11:58:00.000000', target: '111~1' });
      account.add({ id: '2~0~0', time: '2026-10-07 11:59:00.000000', target: '111~2' });
      account.remove('111~1');

      const output = await newRecord.run(triggerContext('ad_group_criterion', store));

      expect(firedNames(output)).toEqual(['111~2']);
    });

    it('should detect new ads the same way', async () => {
      const account = fakeAccount('adGroupAds');
      const store = memoryStore();
      await newRecord.onEnable(triggerContext('ad_group_ad', store));
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
