import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newFile } from '../src/lib/triggers/new-file';
import { newFolder } from '../src/lib/triggers/new-folder';
import { driveTestContext, ListParams, TriggerStore } from './drive-test-context';

const FOLDER = 'application/vnd.google-apps.folder';
const PDF = 'application/pdf';

type VendorItem = { id: string; name: string; mimeType: string; createdTime: string; driveId: string };

const pollingNewFile = driveTestContext.asPolling(newFile);
const pollingNewFolder = driveTestContext.asPolling(newFolder);

const vendor: Vendor = {
  items: [],
  sharedDrives: [],
  incompleteAllDrives: false,
  pageSize: 100,
  callDelayMs: 0,
  stallFilesListFor: undefined,
  stallDrivesList: false,
  filesListInFlight: 0,
  peakFilesListInFlight: 0,
  filesListCalls: [],
};

function inCorpus({ params, item }: { params: ListParams; item: VendorItem }): boolean {
  if (params.corpora === 'allDrives') return true;
  if (params.corpora === 'drive') return item.driveId === params.driveId;
  return item.driveId === 'my-drive';
}

function matchesQuery({ q, item }: { q: string; item: VendorItem }): boolean {
  const created = /createdTime > '([^']+)'/.exec(q);
  if (created && !(Date.parse(item.createdTime) > Date.parse(created[1]))) return false;
  if (q.includes(`mimeType='${FOLDER}'`) && item.mimeType !== FOLDER) return false;
  if (q.includes(`mimeType!='${FOLDER}'`) && item.mimeType === FOLDER) return false;
  return true;
}

const never = <T>() => new Promise<T>(() => undefined);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fakeFilesList(...args: unknown[]) {
  const params = driveTestContext.listParams(args);
  const corpus = params.corpora === 'drive' ? `drive:${params.driveId}` : String(params.corpora);
  vendor.filesListCalls.push(corpus);
  if (vendor.stallFilesListFor !== undefined && params.driveId === vendor.stallFilesListFor) {
    return never();
  }
  vendor.filesListInFlight += 1;
  vendor.peakFilesListInFlight = Math.max(vendor.peakFilesListInFlight, vendor.filesListInFlight);
  if (vendor.callDelayMs > 0) await wait(vendor.callDelayMs);
  vendor.filesListInFlight -= 1;
  const allDrives = params.corpora === 'allDrives';
  const incomplete = allDrives && vendor.incompleteAllDrives;
  const offset = Number(params.pageToken ?? 0);
  const visible = vendor.items
    .filter((item) => inCorpus({ params, item }))
    .filter((item) => !(incomplete && item.driveId !== 'my-drive'))
    .filter((item) => matchesQuery({ q: params.q ?? '', item }))
    .sort((a, b) => Date.parse(b.createdTime) - Date.parse(a.createdTime));
  const page = visible.slice(offset, offset + vendor.pageSize);
  const next = offset + vendor.pageSize < visible.length ? String(offset + vendor.pageSize) : undefined;
  return { status: 200, data: { incompleteSearch: incomplete, nextPageToken: next, files: page.map(({ driveId: _driveId, ...file }) => file) } };
}

async function fakeDrivesList() {
  if (vendor.stallDrivesList) {
    return never();
  }
  return { status: 200, data: { drives: vendor.sharedDrives.map((id) => ({ id })) } };
}

function memoryStore() {
  const store = driveTestContext.memoryStore();
  return {
    store,
    data: { get: store.read, set: store.write },
  };
}

function fileContext({ store }: { store: TriggerStore }) {
  return driveTestContext.triggerContext({
    trigger: pollingNewFile,
    propsValue: { parentFolder: undefined, include_team_drives: true, include_file_content: false },
    store,
  });
}

function folderContext({ store }: { store: TriggerStore }) {
  return driveTestContext.triggerContext({
    trigger: pollingNewFolder,
    propsValue: { parentFolder: undefined, include_team_drives: true },
    store,
  });
}

function seedSharedDrives({ count, mimeType, perDrive, createdAfter }: { count: number; mimeType: string; perDrive: number; createdAfter: number }) {
  vendor.sharedDrives = Array.from({ length: count }, (_, index) => `shared-${index}`);
  vendor.sharedDrives.forEach((driveId, driveIndex) => {
    for (let index = 0; index < perDrive; index++) {
      vendor.items.push({
        id: `${driveId}-${index}`,
        name: `${driveId}-${index}`,
        mimeType,
        createdTime: new Date(createdAfter + 1_000 + driveIndex * perDrive + index).toISOString(),
        driveId,
      });
    }
  });
}

beforeEach(() => {
  vendor.items = [];
  vendor.sharedDrives = [];
  vendor.incompleteAllDrives = false;
  vendor.callDelayMs = 0;
  vendor.stallFilesListFor = undefined;
  vendor.stallDrivesList = false;
  vendor.filesListInFlight = 0;
  vendor.peakFilesListInFlight = 0;
  vendor.filesListCalls = [];
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
  vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation(fakeDrivesList);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Drive incomplete all-drives fallback', () => {
  it('lists 50 shared drives at most 5 at a time and emits every file', async () => {
    const { store, data } = memoryStore();
    await pollingNewFile.onEnable(fileContext({ store }));
    const start = Number(data.get('lastPoll')) - 120_000;
    data.set('lastPoll', start);
    seedSharedDrives({ count: 50, mimeType: PDF, perDrive: 1, createdAfter: start });
    vendor.incompleteAllDrives = true;
    vendor.callDelayMs = 3;
    const out = driveTestContext.driveEvents(await pollingNewFile.run(fileContext({ store })));
    expect(out).toHaveLength(50);
    expect(vendor.filesListCalls.filter((corpus) => corpus.startsWith('drive:'))).toHaveLength(50);
    expect(vendor.peakFilesListInFlight).toBeGreaterThan(1);
    expect(vendor.peakFilesListInFlight).toBeLessThanOrEqual(5);
  });

  it('a stalled drives.list fails the poll before the deadline and keeps the cursor', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(Date.parse('2026-11-01T10:00:00.000Z'));
    const { store, data } = memoryStore();
    await pollingNewFile.onEnable(fileContext({ store }));
    const start = Number(data.get('lastPoll')) - 120_000;
    data.set('lastPoll', start);
    seedSharedDrives({ count: 3, mimeType: PDF, perDrive: 1, createdAfter: start });
    vendor.incompleteAllDrives = true;
    vendor.stallDrivesList = true;
    let outcome: string | undefined;
    const run = pollingNewFile.run(fileContext({ store })).then(
      () => 'resolved',
      (error: unknown) => (error instanceof Error ? error.message : String(error))
    ).then((message) => {
      outcome = message;
    });
    await vi.advanceTimersByTimeAsync(25_000);
    await run;
    expect(outcome).toContain('took too long to list files');
    expect(data.get('lastPoll')).toBe(start);
  });

  it('a stalled files.list on one shared drive fails the poll before the deadline and keeps the cursor', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(Date.parse('2026-11-01T10:00:00.000Z'));
    const { store, data } = memoryStore();
    await pollingNewFile.onEnable(fileContext({ store }));
    const start = Number(data.get('lastPoll')) - 120_000;
    data.set('lastPoll', start);
    seedSharedDrives({ count: 8, mimeType: PDF, perDrive: 1, createdAfter: start });
    vendor.incompleteAllDrives = true;
    vendor.stallFilesListFor = 'shared-6';
    let outcome: string | undefined;
    const run = pollingNewFile.run(fileContext({ store })).then(
      () => 'resolved',
      (error: unknown) => (error instanceof Error ? error.message : String(error))
    ).then((message) => {
      outcome = message;
    });
    await vi.advanceTimersByTimeAsync(25_000);
    await run;
    expect(outcome).toContain('took too long to list files');
    expect(data.get('lastPoll')).toBe(start);
    vendor.stallFilesListFor = undefined;
    const out = driveTestContext.driveEvents(await pollingNewFile.run(fileContext({ store })));
    expect(out).toHaveLength(8);
  });

  it('New Folder test() reads one files.list page per corpus in the fallback', async () => {
    vendor.items = Array.from({ length: vendor.pageSize * 2 }, (_, index) => ({
      id: `mine-${index}`,
      name: `mine-${index}`,
      mimeType: FOLDER,
      createdTime: new Date(Date.parse('2026-10-01T00:00:00.000Z') + index * 1_000).toISOString(),
      driveId: 'my-drive',
    }));
    seedSharedDrives({ count: 3, mimeType: FOLDER, perDrive: vendor.pageSize * 2, createdAfter: Date.parse('2026-10-02T00:00:00.000Z') });
    vendor.incompleteAllDrives = true;
    const { store } = memoryStore();
    const sample = driveTestContext.driveEvents(await pollingNewFolder.test(folderContext({ store })));
    expect(vendor.filesListCalls).toEqual(['allDrives', 'user', 'drive:shared-0', 'drive:shared-1', 'drive:shared-2']);
    expect(sample[0].id).toBe(`shared-2-${vendor.pageSize * 2 - 1}`);
  });

  it('New Folder test() reads one files.list page when the search is complete', async () => {
    vendor.items = Array.from({ length: vendor.pageSize * 3 }, (_, index) => ({
      id: `mine-${index}`,
      name: `mine-${index}`,
      mimeType: FOLDER,
      createdTime: new Date(Date.parse('2026-10-01T00:00:00.000Z') + index * 1_000).toISOString(),
      driveId: 'my-drive',
    }));
    const { store } = memoryStore();
    await pollingNewFolder.test(folderContext({ store }));
    expect(vendor.filesListCalls).toEqual(['allDrives']);
  });
});

type Vendor = {
  items: VendorItem[];
  sharedDrives: string[];
  incompleteAllDrives: boolean;
  pageSize: number;
  callDelayMs: number;
  stallFilesListFor: string | undefined;
  stallDrivesList: boolean;
  filesListInFlight: number;
  peakFilesListInFlight: number;
  filesListCalls: string[];
};
