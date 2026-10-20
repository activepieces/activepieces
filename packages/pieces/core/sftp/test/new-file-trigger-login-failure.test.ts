import { Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { newOrModifiedFile } from '../src/lib/triggers/new-modified-file';

const { sftpClient, ftpClient } = vi.hoisted(() => ({
  sftpClient: { connect: vi.fn(), list: vi.fn(), end: vi.fn() },
  ftpClient: { access: vi.fn(), list: vi.fn(), close: vi.fn() },
}));

vi.mock('ssh2-sftp-client', () => ({ default: vi.fn(() => sftpClient) }));
vi.mock('basic-ftp', () => ({ Client: vi.fn(() => ftpClient) }));

const LOGIN_REFUSED = 'All configured authentication methods failed';

describe('New File trigger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sftpClient.connect.mockResolvedValue(undefined);
    sftpClient.list.mockResolvedValue([]);
    ftpClient.access.mockResolvedValue(undefined);
    ftpClient.list.mockResolvedValue([]);
  });

  test('fails the poll and keeps the checkpoint while the login is refused, then catches up once it works', async () => {
    const lastPoll = Date.now() - 5 * 60_000;
    const store = memoryStore({ lastPoll });
    sftpClient.connect.mockRejectedValue(new Error(LOGIN_REFUSED));

    await expect(newOrModifiedFile.run(pollContext({ store }))).rejects.toThrow(LOGIN_REFUSED);
    expect(await store.get('lastPoll')).toBe(lastPoll);

    sftpClient.connect.mockResolvedValue(undefined);
    sftpClient.list.mockResolvedValue([{ name: 'invoice.csv', modifyTime: Date.now(), type: '-' }]);

    await expect(newOrModifiedFile.run(pollContext({ store }))).resolves.toEqual([
      expect.objectContaining({ name: 'invoice.csv' }),
    ]);
  });

  test('fails the poll when the watched folder cannot be listed, and still closes the client', async () => {
    sftpClient.list.mockRejectedValue(new Error('No such file'));

    await expect(newOrModifiedFile.run(pollContext({}))).rejects.toThrow('No such file');
    expect(sftpClient.end).toHaveBeenCalledTimes(1);
  });

  test('fails the builder sample-data test while the login is refused', async () => {
    sftpClient.connect.mockRejectedValue(new Error(LOGIN_REFUSED));

    await expect(newOrModifiedFile.test(pollContext({}))).rejects.toThrow(LOGIN_REFUSED);
  });

  test('closes the ftp control socket when the login is refused', async () => {
    ftpClient.access.mockRejectedValue(new Error('530 Login incorrect.'));

    await expect(newOrModifiedFile.run(pollContext({ protocol: 'ftp' }))).rejects.toThrow('530 Login incorrect.');
    expect(ftpClient.close).toHaveBeenCalledTimes(1);
  });

  test('still reports an empty folder as no new files', async () => {
    sftpClient.list.mockResolvedValue([]);

    await expect(newOrModifiedFile.run(pollContext({}))).resolves.toEqual([]);
  });
});

function memoryStore(initial: Record<string, unknown>): Store {
  const entries = new Map(Object.entries(initial));
  return {
    async put<T>(key: string, value: T): Promise<T> {
      entries.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return entries.has(key) ? (entries.get(key) as T) : null;
    },
    async delete(key: string): Promise<void> {
      entries.delete(key);
    },
  };
}

function pollContext({ store = memoryStore({ lastPoll: Date.now() - 60_000 }), protocol = 'sftp' }: { store?: Store; protocol?: string }) {
  return {
    auth: { props: { protocol, host: 'files.example.com', port: 22, username: 'user', password: 'rotated-on-the-server' } },
    propsValue: { path: '/inbox', ignoreHiddenFiles: false },
    store,
  } as never;
}
