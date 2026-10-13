import { Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { newOrModifiedFile } from '../src/lib/triggers/new-modified-file';

const { getClient, endClient } = vi.hoisted(() => ({ getClient: vi.fn(), endClient: vi.fn() }));

vi.mock('../src/lib/common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/lib/common')>()),
  getClient,
  endClient,
}));

const loginRefused = new Error('All configured authentication methods failed');

describe('sftp New File trigger', () => {
  beforeEach(() => {
    getClient.mockReset();
    endClient.mockReset();
  });

  test('fails the poll and keeps the checkpoint while the login is refused, then catches up once it works', async () => {
    const lastPoll = Date.now() - 5 * 60_000;
    const store = memoryStore({ lastPoll });
    getClient.mockRejectedValue(loginRefused);

    await expect(newOrModifiedFile.run(pollContext(store))).rejects.toThrow(loginRefused.message);
    expect(await store.get('lastPoll')).toBe(lastPoll);

    getClient.mockResolvedValue({ list: async () => [{ name: 'invoice.csv', modifyTime: Date.now(), type: '-' }] });
    expect(await newOrModifiedFile.run(pollContext(store))).toEqual([expect.objectContaining({ name: 'invoice.csv' })]);
  });

  test('fails the poll when the watched folder cannot be listed', async () => {
    getClient.mockResolvedValue({
      list: async () => {
        throw new Error('No such file');
      },
    });

    await expect(newOrModifiedFile.run(pollContext(memoryStore({ lastPoll: Date.now() })))).rejects.toThrow('No such file');
    expect(endClient).toHaveBeenCalledTimes(1);
  });

  test('fails the sample-data test while the login is refused', async () => {
    getClient.mockRejectedValue(loginRefused);

    await expect(newOrModifiedFile.test(pollContext(memoryStore({})))).rejects.toThrow(loginRefused.message);
  });
});

function memoryStore(initial: Record<string, unknown>): Store {
  const entries = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    async put<T>(key: string, value: T): Promise<T> {
      entries.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const saved = entries.get(key);
      return saved === undefined ? null : JSON.parse(saved);
    },
    async delete(key: string): Promise<void> {
      entries.delete(key);
    },
  };
}

function pollContext(store: Store) {
  return {
    auth: { props: { protocol: 'sftp', host: 'files.example.com', port: 22, username: 'user', password: 'rotated-on-the-server' } },
    propsValue: { path: '/inbox', ignoreHiddenFiles: false },
    store,
  } as never;
}
