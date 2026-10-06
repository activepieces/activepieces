import { beforeEach, describe, expect, it, vi } from 'vitest';

const search = vi.fn<() => Promise<unknown>>();
const searchAll = vi.fn<() => Promise<unknown>>();

vi.mock('../../../src/lib/common/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/client')>();
  return { ...actual, GoogleAdsApi: { search, searchAll } };
});

const { newRecord } = await import('../../../src/lib/triggers/new-record');

const AUTH = { access_token: 'ya29.test-token' };
const KEY = 'google_ads_new_record_last_id';

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

describe('newRecord', () => {
  beforeEach(() => {
    search.mockReset();
    searchAll.mockReset();
  });

  it('should be a polling trigger', () => {
    expect(newRecord.type).toBe('POLLING');
  });

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
    const rows = Array.from({ length: 150 }, (_, i) => ({ adGroupAd: { ad: { id: String(1001 + i) }, status: 'ENABLED' } }));
    searchAll.mockResolvedValue({ results: rows, truncated: false });
    const store = memoryStore({ [KEY]: '1000' });

    const output = await newRecord.run(triggerContext('ad_group_ad', store));

    expect(searchAll).toHaveBeenCalledWith({
      auth: AUTH,
      customerId: '1234567890',
      query: expect.stringMatching(/FROM ad_group_ad WHERE ad_group_ad\.status != 'REMOVED' AND ad_group_ad\.ad\.id > 1000 ORDER BY ad_group_ad\.ad\.id ASC$/),
      maxRows: 1000,
    });
    expect(output).toHaveLength(150);
    expect(store.data.get(KEY)).toBe('1150');
  });

  it('should keep the checkpoint when nothing new was created, even if the last seen record was removed', async () => {
    searchAll.mockResolvedValue({ results: [], truncated: false });
    const store = memoryStore({ [KEY]: '1000' });

    const output = await newRecord.run(triggerContext('campaign', store));

    expect(output).toEqual([]);
    expect(store.data.get(KEY)).toBe('1000');
  });

  it('should apply the keyword filter for criteria', async () => {
    searchAll.mockResolvedValue({ results: [], truncated: false });

    await newRecord.run(triggerContext('ad_group_criterion', memoryStore({ [KEY]: '7' })));

    expect(searchAll).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.stringContaining("WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status != 'REMOVED' AND ad_group_criterion.criterion_id > 7 ORDER BY"),
      })
    );
  });

  it('should set a baseline instead of firing when no checkpoint exists', async () => {
    search.mockResolvedValue({ results: [{ campaign: { id: '42' } }] });
    const store = memoryStore();

    const output = await newRecord.run(triggerContext('campaign', store));

    expect(output).toEqual([]);
    expect(searchAll).not.toHaveBeenCalled();
    expect(store.data.get(KEY)).toBe('42');
  });

  it('should clear the checkpoint on disable', async () => {
    const store = memoryStore({ [KEY]: '42' });

    await newRecord.onDisable(triggerContext('campaign', store));

    expect(store.data.has(KEY)).toBe(false);
  });

  it('should return the newest records as test data', async () => {
    search.mockResolvedValue({ results: [{ campaign: { id: '3' } }, { campaign: { id: '2' } }] });

    const output = await newRecord.test(triggerContext('campaign', memoryStore()));

    expect(search).toHaveBeenCalledWith(expect.objectContaining({ query: expect.stringMatching(/ORDER BY campaign\.id DESC LIMIT 5$/) }));
    expect(output).toHaveLength(2);
  });

  it('should reject a non-numeric checkpoint', async () => {
    await expect(newRecord.run(triggerContext('campaign', memoryStore({ [KEY]: '1 OR 1=1' })))).rejects.toThrow('Invalid checkpoint id');
  });
});
