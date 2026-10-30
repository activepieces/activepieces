import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { excelCommon } from '../src/lib/common/common';
import { updatedRowTrigger } from '../src/lib/trigger/updated-row';

describe('Updated Row startup', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: 1_000 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('seeds existing rows on a fresh enable, then reports only a changed row', async () => {
    const store = new Map<string, string>();
    const sheet = fakeSheet({ rows: [['Ada', 1], ['Linus', 2]] });

    await updatedRowTrigger.onEnable(triggerContext({ store, isRepublish: false }));
    expect(await runAfterTick({ store })).toEqual([]);

    sheet.set({ rows: [['Ada', 1], ['Linus', 3]] });
    expect(await runAfterTick({ store })).toEqual([
      { rowIndex: 2, values: { A: 'Linus', B: 3 }, changeType: 'updated' },
    ]);
  });

  it('keeps saved row hashes on a republish, so a change made before it is still reported', async () => {
    const store = new Map<string, string>();
    const sheet = fakeSheet({ rows: [['Ada', 1], ['Linus', 2]] });
    await updatedRowTrigger.onEnable(triggerContext({ store, isRepublish: false }));

    sheet.set({ rows: [['Ada', 1], ['Linus', 3]] });
    await updatedRowTrigger.onEnable(triggerContext({ store, isRepublish: true }));

    expect(await runAfterTick({ store })).toEqual([
      { rowIndex: 2, values: { A: 'Linus', B: 3 }, changeType: 'updated' },
    ]);
    sheet.set({ rows: [['Ada', 1], ['Linus', 3], ['Grace', 4]] });
    expect(await runAfterTick({ store })).toEqual([
      { rowIndex: 3, values: { A: 'Grace', B: 4 }, changeType: 'added' },
    ]);
  });

  it('seeds on a republish that has no saved row hashes yet', async () => {
    const store = new Map<string, string>();
    const sheet = fakeSheet({ rows: [['Ada', 1], ['Linus', 2]] });

    await updatedRowTrigger.onEnable(triggerContext({ store, isRepublish: true }));
    expect(await runAfterTick({ store })).toEqual([]);

    sheet.set({ rows: [['Ada', 5], ['Linus', 2]] });
    expect(await runAfterTick({ store })).toEqual([
      { rowIndex: 1, values: { A: 'Ada', B: 5 }, changeType: 'updated' },
    ]);
  });
});

function fakeSheet({ rows }: { rows: (string | number | boolean)[][] }) {
  let current = rows;
  vi.spyOn(excelCommon, 'getAllRows').mockImplementation(async () => current);
  return {
    set: ({ rows: next }: { rows: (string | number | boolean)[][] }) => {
      current = next;
    },
  };
}

async function runAfterTick({ store }: { store: Map<string, string> }) {
  vi.setSystemTime(Date.now() + 1_000);
  return updatedRowTrigger.run(triggerContext({ store, isRepublish: false }));
}

function triggerContext({ store, isRepublish }: { store: Map<string, string>; isRepublish: boolean }) {
  return {
    ...createMockPollingTriggerContext({ propsValue: PROPS }),
    auth: AUTH,
    isRepublish,
    store: {
      put: async <T>(key: string, value: T) => {
        store.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = store.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  };
}

const PROPS = {
  storageSource: 'onedrive',
  siteId: undefined,
  documentId: undefined,
  workbookId: 'workbook-1',
  worksheetId: 'Sheet1',
  has_headers: false,
};

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com/redirect',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: 'Files.ReadWrite',
  token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  data: {},
  props: {},
};
