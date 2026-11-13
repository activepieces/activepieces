import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newFile } from '../src/lib/triggers/new-file';
import { newFolder } from '../src/lib/triggers/new-folder';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { driveTestContext } from './drive-test-context';

type Page = { files: Record<string, unknown>[]; nextPageToken?: string };

const fake = { pages: new Array<Page>(), calls: 0 };

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const ids = (items: unknown[]) => driveTestContext.driveEvents(items).map((item) => item.id);

function serve(...args: unknown[]) {
  fake.calls += 1;
  const token = driveTestContext.listParams(args).pageToken;
  const index = token ? Number(token.replace('page-', '')) : 0;
  const page = fake.pages[index] ?? { files: [] };
  return Promise.resolve({ data: { kind: 'drive#fileList', files: page.files, nextPageToken: page.nextPageToken } });
}

function sample({ trigger }: { trigger: 'updated' | 'file' | 'folder' }) {
  const store = driveTestContext.memoryStore();
  if (trigger === 'updated') {
    const polling = driveTestContext.asPolling(newOrUpdatedFile);
    return polling.test(driveTestContext.triggerContext({ trigger: polling, propsValue: { behaviourNote: undefined, parentFolder: undefined, include_team_drives: true, file_types: undefined, include_file_content: false }, store }));
  }
  if (trigger === 'file') {
    const polling = driveTestContext.asPolling(newFile);
    return polling.test(driveTestContext.triggerContext({ trigger: polling, propsValue: { parentFolder: undefined, include_team_drives: false, include_file_content: false }, store }));
  }
  const polling = driveTestContext.asPolling(newFolder);
  return polling.test(driveTestContext.triggerContext({ trigger: polling, propsValue: { parentFolder: undefined, include_team_drives: false }, store }));
}

beforeEach(() => {
  fake.calls = 0;
  fake.pages = [];
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(serve);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PIE-1148 Drive trigger test() looks past the first files.list page', () => {
  it('New or Updated File: an empty first page still yields the file on page 2', async () => {
    fake.pages = [
      { files: [], nextPageToken: 'page-1' },
      { files: [{ kind: 'drive#file', id: 'file-1', name: 'budget.xlsx', mimeType: 'text/csv', createdTime: hoursAgo(30), modifiedTime: hoursAgo(1) }] },
    ];
    expect(ids(await sample({ trigger: 'updated' }))).toEqual(['file-1']);
  });

  it('New or Updated File: a first page of only future-dated files still yields the real file on page 2', async () => {
    fake.pages = [
      { files: [{ kind: 'drive#file', id: 'future-1', name: 'imported.pdf', mimeType: 'application/pdf', createdTime: hoursAgo(5), modifiedTime: '2031-01-01T00:00:00.000Z' }], nextPageToken: 'page-1' },
      { files: [{ kind: 'drive#file', id: 'file-2', name: 'notes.txt', mimeType: 'text/plain', createdTime: hoursAgo(3), modifiedTime: hoursAgo(2) }] },
    ];
    expect(ids(await sample({ trigger: 'updated' }))).toEqual(['file-2']);
  });

  it('New File: an empty first page still yields the file on page 2', async () => {
    fake.pages = [
      { files: [], nextPageToken: 'page-1' },
      { files: [{ kind: 'drive#file', id: 'file-1', name: 'scan.pdf', mimeType: 'application/pdf', createdTime: hoursAgo(1), modifiedTime: hoursAgo(1) }] },
    ];
    expect(ids(await sample({ trigger: 'file' }))).toEqual(['file-1']);
    expect(fake.calls).toBe(2);
  });

  it('New File: a future-dated first file is accepted like run() accepts it, so paging stops on page 1', async () => {
    fake.pages = [
      { files: [{ kind: 'drive#file', id: 'future-1', name: 'imported.pdf', mimeType: 'application/pdf', createdTime: '2031-01-01T00:00:00.000Z', modifiedTime: hoursAgo(1) }], nextPageToken: 'page-1' },
      { files: [{ kind: 'drive#file', id: 'file-2', name: 'notes.txt', mimeType: 'text/plain', createdTime: hoursAgo(3), modifiedTime: hoursAgo(2) }] },
    ];
    expect(ids(await sample({ trigger: 'file' }))).toEqual(['future-1']);
    expect(fake.calls).toBe(1);
  });

  it('New Folder: an empty first page still yields the folder on page 2', async () => {
    fake.pages = [
      { files: [], nextPageToken: 'page-1' },
      { files: [{ id: 'folder-1', name: 'Invoices', createdTime: hoursAgo(1) }] },
    ];
    expect(ids(await sample({ trigger: 'folder' }))).toEqual(['folder-1']);
    expect(fake.calls).toBe(2);
  });

  it('New Folder: a future-dated first folder is accepted like run() accepts it, so paging stops on page 1', async () => {
    fake.pages = [
      { files: [{ id: 'future-1', name: 'Imported', createdTime: '2031-01-01T00:00:00.000Z' }], nextPageToken: 'page-1' },
      { files: [{ id: 'folder-2', name: 'Invoices', createdTime: hoursAgo(3) }] },
    ];
    expect(ids(await sample({ trigger: 'folder' }))).toEqual(['future-1']);
    expect(fake.calls).toBe(1);
  });
});
