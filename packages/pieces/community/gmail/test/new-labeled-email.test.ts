/// <reference types="vitest/globals" />

import { Store } from '@activepieces/pieces-framework';

const historyListMock = vi.fn();
const getProfileMock = vi.fn().mockResolvedValue({ data: { historyId: 'current-history-id' } });

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: {
      history: { list: historyListMock },
      getProfile: getProfileMock,
    },
  }),
}));

vi.mock('../src/lib/auth', () => ({
  gmailAuth: {},
  createGoogleClient: vi.fn().mockResolvedValue({}),
}));

import { gmailNewLabeledEmailTrigger } from '../src/lib/triggers/new-labeled-email';

describe('gmailNewLabeledEmailTrigger.run', () => {
  beforeEach(() => {
    historyListMock.mockReset();
  });

  it('resets to the current history id when the stored one has expired', async () => {
    historyListMock.mockRejectedValue(Object.assign(new Error('Requested entity was not found.'), { code: 404 }));
    const store = memoryStore({ lastHistoryId: 'expired-history-id' });

    const result = await gmailNewLabeledEmailTrigger.run(makeContext(store));

    expect(result).toEqual([]);
    expect(await store.get('lastHistoryId')).toBe('current-history-id');
  });

  it('rethrows errors that are not an expired history id', async () => {
    historyListMock.mockRejectedValue(Object.assign(new Error('Backend Error'), { code: 500 }));
    const store = memoryStore({ lastHistoryId: 'some-history-id' });

    await expect(gmailNewLabeledEmailTrigger.run(makeContext(store))).rejects.toThrow('Backend Error');
    expect(await store.get('lastHistoryId')).toBe('some-history-id');
  });
});

function makeContext(store: Store): Parameters<typeof gmailNewLabeledEmailTrigger.run>[0] {
  return {
    auth: {},
    propsValue: { label: { id: 'Label_1', name: 'Invoices' } },
    store,
    files: {},
  } as unknown as Parameters<typeof gmailNewLabeledEmailTrigger.run>[0];
}

function memoryStore(initial: Record<string, unknown>): Store {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.get(key) as T) ?? null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}
