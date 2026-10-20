import { Store } from '@activepieces/pieces-framework';
import { FileType } from 'basic-ftp';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { newOrModifiedFile } from '../src/lib/triggers/new-modified-file';

const { ftpClient } = vi.hoisted(() => ({
  ftpClient: { access: vi.fn(), list: vi.fn(), lastMod: vi.fn(), close: vi.fn() },
}));

vi.mock('ssh2-sftp-client', () => ({ default: vi.fn() }));
vi.mock('basic-ftp', async (importOriginal) => ({
  ...(await importOriginal<typeof import('basic-ftp')>()),
  Client: vi.fn(() => ftpClient),
}));

const MODIFIED_AT = new Date('2026-10-20T14:40:13.000Z');

describe('New File trigger over FTP', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ftpClient.access.mockResolvedValue(undefined);
    ftpClient.list.mockResolvedValue([]);
  });

  test('emits a file once when the server has no MLSD, instead of re-emitting it every poll', async () => {
    const store = memoryStore({ lastPoll: MODIFIED_AT.getTime() - 60_000 });
    ftpClient.list.mockResolvedValue([listEntry({ name: 'report.csv' })]);
    ftpClient.lastMod.mockResolvedValue(MODIFIED_AT);

    await expect(newOrModifiedFile.run(pollContext(store))).resolves.toEqual([
      expect.objectContaining({ name: 'report.csv' }),
    ]);
    await expect(newOrModifiedFile.run(pollContext(store))).resolves.toEqual([]);
    await expect(newOrModifiedFile.run(pollContext(store))).resolves.toEqual([]);
  });

  test('asks the server for the timestamp with the full path, once per file', async () => {
    ftpClient.list.mockResolvedValue([listEntry({ name: 'report.csv' })]);
    ftpClient.lastMod.mockResolvedValue(MODIFIED_AT);

    await newOrModifiedFile.run(pollContext(memoryStore({ lastPoll: 0 })));

    expect(ftpClient.lastMod).toHaveBeenCalledTimes(1);
    expect(ftpClient.lastMod).toHaveBeenCalledWith('/inbox/report.csv');
  });

  test('never asks the server to timestamp a directory, which answers 550', async () => {
    ftpClient.list.mockResolvedValue([listEntry({ name: 'subdir', type: FileType.Directory })]);

    await expect(newOrModifiedFile.run(pollContext(memoryStore({ lastPoll: 0 })))).resolves.toEqual([]);
    expect(ftpClient.lastMod).not.toHaveBeenCalled();
  });

  test('skips a file the server refuses to timestamp rather than treating it as new', async () => {
    ftpClient.list.mockResolvedValue([listEntry({ name: 'report.csv' })]);
    ftpClient.lastMod.mockRejectedValue(new Error('550 Could not get file modification time.'));

    await expect(newOrModifiedFile.run(pollContext(memoryStore({ lastPoll: 0 })))).resolves.toEqual([]);
  });

  test('uses the listing timestamp and skips MDTM when the server supports MLSD', async () => {
    ftpClient.list.mockResolvedValue([listEntry({ name: 'report.csv', modifiedAt: MODIFIED_AT })]);

    await expect(newOrModifiedFile.run(pollContext(memoryStore({ lastPoll: 0 })))).resolves.toEqual([
      expect.objectContaining({ name: 'report.csv' }),
    ]);
    expect(ftpClient.lastMod).not.toHaveBeenCalled();
  });

  test('emits the file again once it is genuinely modified', async () => {
    const store = memoryStore({ lastPoll: 0 });
    ftpClient.list.mockResolvedValue([listEntry({ name: 'report.csv' })]);
    ftpClient.lastMod.mockResolvedValue(MODIFIED_AT);
    await newOrModifiedFile.run(pollContext(store));

    ftpClient.lastMod.mockResolvedValue(new Date(MODIFIED_AT.getTime() + 1_000));

    await expect(newOrModifiedFile.run(pollContext(store))).resolves.toEqual([
      expect.objectContaining({ name: 'report.csv' }),
    ]);
  });
});

function listEntry({ name, type = FileType.File, modifiedAt }: { name: string; type?: FileType; modifiedAt?: Date }) {
  return { name, type, size: 12, rawModifiedAt: 'Oct 20 14:40', modifiedAt };
}

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

function pollContext(store: Store) {
  return {
    auth: { props: { protocol: 'ftp', host: 'files.example.com', port: 21, username: 'user', password: 'secret' } },
    propsValue: { path: '/inbox', ignoreHiddenFiles: false },
    store,
  } as never;
}
