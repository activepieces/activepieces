import { FilesService } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { driveExportFolderAsZip } from '../src/lib/action/drive-export-folder-as-zip';
import { driveSearchFiles } from '../src/lib/action/drive-search-files';
import { googleDriveListFiles } from '../src/lib/action/list-files.action';
import { drivePoll } from '../src/lib/common/drive-poll';
import { newFile } from '../src/lib/triggers/new-file';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { driveTestContext, TriggerStore } from './drive-test-context';

const PDF = 'application/pdf';
const START = Date.parse('2026-11-01T10:00:00.000Z');

type VendorItem = { id: string; name: string; mimeType: string; createdTime: string; modifiedTime: string };

const vendor = { items: new Array<VendorItem>(), pageSize: 1000, msPerPage: 0, incompleteAllDrives: false };
let clock = START;

function at(ms: number): string {
  return new Date(START + ms).toISOString();
}

function add({ id, createdMs, modifiedMs }: { id: string; createdMs: number; modifiedMs?: number }) {
  vendor.items.push({ id, name: id, mimeType: PDF, createdTime: at(createdMs), modifiedTime: at(modifiedMs ?? createdMs) });
}

function compare({ value, op, bound }: { value: number; op: string; bound: number }): boolean {
  return op === '>=' ? value >= bound : value > bound;
}

function matches({ q, item }: { q: string; item: VendorItem }): boolean {
  const changed = /\(modifiedTime (>=?) '([^']+)' or createdTime (>=?) '([^']+)'\)/.exec(q);
  if (changed) {
    const bound = Date.parse(changed[2]);
    return compare({ value: Date.parse(item.modifiedTime), op: changed[1], bound }) || compare({ value: Date.parse(item.createdTime), op: changed[3], bound });
  }
  const created = /createdTime (>=?) '([^']+)'/.exec(q);
  if (created && !compare({ value: Date.parse(item.createdTime), op: created[1], bound: Date.parse(created[2]) })) return false;
  const modified = /modifiedTime (>=?) '([^']+)'/.exec(q);
  return modified ? compare({ value: Date.parse(item.modifiedTime), op: modified[1], bound: Date.parse(modified[2]) }) : true;
}

async function fakeFilesList(...args: unknown[]) {
  const params = driveTestContext.listParams(args);
  clock += vendor.msPerPage;
  if (params.corpora === 'allDrives' && vendor.incompleteAllDrives) {
    return { status: 200, data: { incompleteSearch: true, files: [] } };
  }
  const key = params.orderBy?.startsWith('modifiedTime') ? 'modifiedTime' : 'createdTime';
  const direction = params.orderBy?.endsWith(' desc') ? -1 : 1;
  const visible = vendor.items
    .filter((item) => matches({ q: params.q ?? '', item }))
    .sort((a, b) => direction * (Date.parse(a[key]) - Date.parse(b[key])) || a.id.localeCompare(b.id));
  const offset = Number(params.pageToken ?? 0);
  const next = offset + vendor.pageSize < visible.length ? String(offset + vendor.pageSize) : undefined;
  return { status: 200, data: { incompleteSearch: false, nextPageToken: next, files: visible.slice(offset, offset + vendor.pageSize).map((file) => ({ kind: 'drive#file', ...file })) } };
}

async function noSharedDrives() {
  return { status: 200, data: { drives: [] } };
}

async function fakeFetch(input: string | URL) {
  const url = String(input);
  if (url.includes('fields=mimeType')) {
    return new Response(JSON.stringify({ mimeType: PDF }), { headers: { 'content-type': 'application/json' } });
  }
  return new Response('bytes');
}

beforeEach(() => {
  vendor.items = [];
  vendor.pageSize = 1000;
  vendor.msPerPage = 0;
  vendor.incompleteAllDrives = false;
  clock = START;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  driveTestContext.routeFileLookupsToFetch();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ids = (events: unknown[]) => driveTestContext.driveEvents(events).map((event) => event.id);

function newFileHooks({ store, withContent }: { store: TriggerStore; withContent: boolean }) {
  const trigger = driveTestContext.asPolling(newFile);
  const ctx = (isRepublish?: boolean) => driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false, include_file_content: withContent }, store, isRepublish });
  return { enable: () => trigger.onEnable(ctx()), run: () => trigger.run(ctx()) };
}

function updatedHooks({ store }: { store: TriggerStore }) {
  const trigger = driveTestContext.asPolling(newOrUpdatedFile);
  const ctx = () => driveTestContext.triggerContext({ trigger, propsValue: { behaviourNote: undefined, parentFolder: undefined, include_team_drives: false, file_types: undefined, include_file_content: false }, store });
  return { enable: () => trigger.onEnable(ctx()), run: () => trigger.run(ctx()) };
}

describe('QA r2: drive poll edges', () => {
  it.each([false, true])('New File: files sharing the millisecond at the cap boundary all fire once (content %s)', async (withContent) => {
    const store = driveTestContext.memoryStore();
    const hooks = newFileHooks({ store, withContent });
    await hooks.enable();
    const cap = drivePoll.maxItemsPerPoll({ includeFileContent: withContent });
    const tied = Array.from({ length: cap + 3 }, (_, index) => `tie-${String(index).padStart(4, '0')}`);
    tied.forEach((id) => add({ id, createdMs: 5_000 }));
    const polls: string[][] = [];
    for (let poll = 0; poll < 3; poll++) {
      clock += 60_000;
      polls.push(ids(await hooks.run()));
    }
    expect(polls.map((poll) => poll.length)).toEqual([cap, 3, 0]);
    expect(polls.flat()).toEqual(tied);
  });

  it('New or Updated: files sharing the modified millisecond at the cap boundary all fire once', async () => {
    const store = driveTestContext.memoryStore();
    const hooks = updatedHooks({ store });
    await hooks.enable();
    const cap = drivePoll.maxItemsPerPoll({ includeFileContent: false });
    const tied = Array.from({ length: cap + 2 }, (_, index) => `tie-${String(index).padStart(4, '0')}`);
    tied.forEach((id) => add({ id, createdMs: 5_000 }));
    const polls: string[][] = [];
    for (let poll = 0; poll < 3; poll++) {
      clock += 60_000;
      polls.push(ids(await hooks.run()));
    }
    expect(polls.map((poll) => poll.length)).toEqual([cap, 2, 0]);
    expect(new Set(polls.flat()).size).toBe(tied.length);
  });

  it.each([false, true])('New File: a 1,200-file backlog with new files arriving mid-drain loses nothing and fires each once, oldest first (content %s)', async (withContent) => {
    const store = driveTestContext.memoryStore();
    const hooks = newFileHooks({ store, withContent });
    await hooks.enable();
    vendor.pageSize = 100;
    const backlog = Array.from({ length: 1200 }, (_, index) => `b-${String(index).padStart(5, '0')}`);
    backlog.forEach((id, index) => add({ id, createdMs: 1_000 + index * 10 }));
    const fired: string[] = [];
    const arrivals: string[] = [];
    for (let poll = 0; poll < 40; poll++) {
      clock += 60_000;
      if (poll % 3 === 1) {
        const id = `live-${String(poll).padStart(3, '0')}`;
        arrivals.push(id);
        add({ id, createdMs: clock - START - 1_000 });
      }
      fired.push(...ids(await hooks.run()));
    }
    expect(fired).toHaveLength(backlog.length + arrivals.length);
    expect(new Set(fired).size).toBe(fired.length);
    expect(fired.filter((id) => id.startsWith('b-'))).toEqual(backlog);
    expect(new Set(fired)).toEqual(new Set([...backlog, ...arrivals]));
  });

  it('the stored re-check set stays bounded at 2,000 entries and under 512 KB with long ids', async () => {
    const store = driveTestContext.memoryStore();
    const hooks = newFileHooks({ store, withContent: false });
    await hooks.enable();
    const longId = ({ poll, index }: { poll: number; index: number }) => `${'x'.repeat(90)}-${poll}-${index}`;
    for (let poll = 0; poll < 8; poll++) {
      const base = 1_000 + poll * 10_000;
      Array.from({ length: 480 }, (_, index) => add({ id: longId({ poll, index }), createdMs: base + index }));
      clock = START + base + 9_000;
      await hooks.run();
    }
    const recent = store.read('driveRecent');
    const seen = typeof recent === 'object' && recent !== null && 'seen' in recent && Array.isArray(recent.seen) ? recent.seen : [];
    expect(seen.length).toBeLessThanOrEqual(2000);
    expect(JSON.stringify(recent).length).toBeLessThan(512 * 1024);
  });
});

describe('QA r2 recheck: New or Updated two listings', () => {
  it('when both listings stop at the time limit, the lower cut-off wins and no file is skipped', async () => {
    const store = driveTestContext.memoryStore();
    const hooks = updatedHooks({ store });
    await hooks.enable();
    const yearsAgo = -3 * 365 * 24 * 3_600_000;
    const keptMtime = Array.from({ length: 8 }, (_, index) => `p-${index}`);
    keptMtime.forEach((id, index) => add({ id, createdMs: 1_000 * (index + 1), modifiedMs: yearsAgo + index }));
    const normal = Array.from({ length: 8 }, (_, index) => `n-${index}`);
    normal.forEach((id, index) => add({ id, createdMs: 20_000 + 1_000 * index }));
    clock += 60_000;
    vendor.pageSize = 2;
    vendor.msPerPage = 7_000;
    const first = ids(await hooks.run());
    expect(first.length).toBeLessThan(keptMtime.length + normal.length);
    vendor.pageSize = 1000;
    vendor.msPerPage = 0;
    const fired = [...first];
    for (let poll = 0; poll < 3; poll++) {
      clock += 60_000;
      fired.push(...ids(await hooks.run()));
    }
    expect(fired).toEqual([...keptMtime, ...normal]);
  });
});

describe('QA r2 recheck: seen overflow at one millisecond', () => {
  it('2,600 files in the same millisecond each fire once, with no re-fire after the seen set passes 2,000', async () => {
    const store = driveTestContext.memoryStore();
    const hooks = newFileHooks({ store, withContent: false });
    await hooks.enable();
    const tied = Array.from({ length: 2_600 }, (_, index) => `same-${String(index).padStart(4, '0')}`);
    tied.forEach((id) => add({ id, createdMs: 5_000 }));
    const fired: string[] = [];
    for (let poll = 0; poll < 8; poll++) {
      clock += 60_000;
      fired.push(...ids(await hooks.run()));
    }
    expect(fired).toEqual(tied);
  });
});

describe('Greptile recheck: saved page position', () => {
  it('after a disable and enable, a saved position from the old cursor is ignored and a new file fires on the first poll', async () => {
    const store = driveTestContext.memoryStore();
    const trigger = driveTestContext.asPolling(newFile);
    const ctx = () => driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false, include_file_content: false }, store });
    await trigger.onEnable(ctx());
    Array.from({ length: 1_000 }, (_, index) => add({ id: `group-${String(index).padStart(4, '0')}`, createdMs: 5_000 }));
    vendor.pageSize = 20;
    vendor.msPerPage = 4_000;
    clock += 60_000;
    const first = ids(await trigger.run(ctx()));
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThan(1_000);
    expect(JSON.stringify(store.read('driveResume'))).toContain('pageToken');
    await trigger.onDisable(ctx());
    clock += 60_000;
    await trigger.onEnable(ctx());
    add({ id: 'after-enable', createdMs: clock - START + 1_000 });
    clock += 60_000;
    expect(ids(await trigger.run(ctx()))).toEqual(['after-enable']);
  });

  it('when Drive cannot finish the resumed shared-drive search, the same poll falls back to a fresh listing', async () => {
    const store = driveTestContext.memoryStore();
    const trigger = driveTestContext.asPolling(newFile);
    const ctx = () => driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: true, include_file_content: false }, store });
    vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation(noSharedDrives);
    await trigger.onEnable(ctx());
    const group = Array.from({ length: 300 }, (_, index) => `group-${String(index).padStart(4, '0')}`);
    group.forEach((id) => add({ id, createdMs: 5_000 }));
    vendor.pageSize = 20;
    vendor.msPerPage = 4_000;
    clock += 60_000;
    const first = ids(await trigger.run(ctx()));
    expect(JSON.stringify(store.read('driveResume'))).toContain('allDrives');
    vendor.msPerPage = 0;
    vendor.incompleteAllDrives = true;
    clock += 60_000;
    const second = ids(await trigger.run(ctx()));
    expect([...first, ...second].sort()).toEqual(group);
  });
});

describe('Greptile recheck: shared test fakes honour orderBy and the comparison', () => {
  const items = [
    { id: 'b', createdTime: at(2_000), modifiedTime: at(9_000) },
    { id: 'a', createdTime: at(1_000), modifiedTime: at(1_000) },
    { id: 'c', createdTime: at(3_000), modifiedTime: at(3_000) },
  ];

  it('sorts ascending by default and descending with desc, on the requested key', () => {
    const order = (orderBy: string | undefined) => driveTestContext.sortForOrderBy({ items, orderBy }).map((item) => item.id);
    expect(order('createdTime')).toEqual(['a', 'b', 'c']);
    expect(order('createdTime desc')).toEqual(['c', 'b', 'a']);
    expect(order('modifiedTime')).toEqual(['a', 'c', 'b']);
    expect(order('modifiedTime desc')).toEqual(['b', 'c', 'a']);
  });

  it('>= keeps the bound, > drops it, and the or-clause matches either time', () => {
    const match = (q: string) => items.filter((item) => driveTestContext.matchesTimeQuery({ q, item })).map((item) => item.id).sort();
    expect(match(`createdTime >= '${at(2_000)}'`)).toEqual(['b', 'c']);
    expect(match(`createdTime > '${at(2_000)}'`)).toEqual(['c']);
    expect(match(`modifiedTime >= '${at(9_000)}'`)).toEqual(['b']);
    expect(match(`modifiedTime > '${at(9_000)}'`)).toEqual([]);
    expect(match(`(modifiedTime > '${at(3_000)}' or createdTime > '${at(3_000)}')`)).toEqual(['b']);
    expect(match(`(modifiedTime >= '${at(3_000)}' or createdTime >= '${at(3_000)}')`)).toEqual(['b', 'c']);
  });
});

describe('QA r2: actions', () => {
  it('Search Files and Folders uses the 120 s action budget, not the 25 s poll budget', async () => {
    vendor.pageSize = 1;
    vendor.msPerPage = 30_000;
    ['a', 'b', 'c', 'd'].forEach((id, index) => add({ id, createdMs: index }));
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: 'name', operator: 'contains', value: 'x', type: 'all', parent_folder_id: undefined, include_team_drives: false } });
    const result = await driveSearchFiles.run(context);
    expect((Array.isArray(result) ? result : []).map((file: { id: string }) => file.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('List Files reports incompleteSearch false when Google searched the whole folder', async () => {
    vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation((async () => ({ status: 200, data: { id: 'folder-1', driveId: 'sd-1' } })));
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((async () => ({ status: 200, headers: {}, body: { incompleteSearch: false, files: [{ id: 'f', name: 'f.pdf', mimeType: PDF }] } })));
    const context = driveTestContext.actionContext({ action: googleDriveListFiles, propsValue: { folderId: 'folder-1', depthLevel: 1, downloadFiles: false, include_team_drives: true, includeTrashed: false } });
    const result = driveTestContext.listFilesResult(await googleDriveListFiles.run(context));
    expect(result.incompleteSearch).toBe(false);
  });
});

describe('QA r2: Export Folder as Zip listing', () => {
  function zipContext({ folderId }: { folderId: string }) {
    const write = vi.fn<FilesService['write']>(async () => 'https://files.example/out.zip');
    const upload = vi.fn<FilesService['upload']>(async () => ({ id: 'out', url: 'https://files.example/out.zip' }));
    const context = driveTestContext.actionContext({ action: driveExportFolderAsZip, propsValue: { folderId, includeTeamDrives: true, googleDocsFormat: 'docx', googleSheetsFormat: 'xlsx', googleSlidesFormat: 'pptx', duplicatePathWarning: undefined, outputFileName: 'out.zip', usePassword: false, passwordOptions: {} }, files: { write, upload } });
    return { context, write };
  }

  function recordListings({ incompleteSearch }: { incompleteSearch: boolean }) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation((async () => ({ status: 200, headers: {}, body: { incompleteSearch, files: [] } })));
  }

  it('fails on an incomplete search instead of writing a partial zip', async () => {
    vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation((async () => ({ status: 200, data: { id: 'folder-1', driveId: 'sd-1' } })));
    recordListings({ incompleteSearch: true });
    const { context, write } = zipContext({ folderId: 'folder-1' });
    await expect(driveExportFolderAsZip.run(context)).rejects.toThrow('could not search every file');
    expect(write).not.toHaveBeenCalled();
  });

  it('lists a shared-drive folder in that drive only and escapes the folder id', async () => {
    vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation((async () => ({ status: 200, data: { id: "it's", driveId: 'sd-1' } })));
    const sendRequest = recordListings({ incompleteSearch: true });
    const { context } = zipContext({ folderId: "it's \\ x" });
    await driveExportFolderAsZip.run(context).catch(() => undefined);
    const queries = sendRequest.mock.calls.map(([request]) => new URL(request.url).searchParams);
    expect(queries.map((query) => [query.get('corpora'), query.get('driveId')])).toEqual([['drive', 'sd-1']]);
    expect(queries[0].get('q')).toBe("'it\\'s \\\\ x' in parents and trashed=false");
  });
});
