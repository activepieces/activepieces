import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { common } from '../src/lib/common';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { driveTestContext, TriggerStore } from './drive-test-context';

type VendorItem = { id: string; name: string; createdTime: string; modifiedTime: string };
type Page = { files: VendorItem[]; nextPageToken?: string };

const trigger = driveTestContext.asPolling(newOrUpdatedFile);
const baseProps = { behaviourNote: undefined, file_types: undefined, parentFolder: undefined, include_team_drives: false, include_file_content: false };
const FUTURE = '2031-01-01T00:00:00.000Z';

const vendor: { mode: 'pages' | 'live'; pages: Page[]; items: VendorItem[]; listCalls: number; listCallCost: number } = {
  mode: 'pages',
  pages: [],
  items: [],
  listCalls: 0,
  listCallCost: 0,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');
const tick = (minutes = 5) => {
  clock += minutes * 60_000;
  return new Date(clock).toISOString();
};

function ago({ minutes }: { minutes: number }): string {
  return new Date(clock - minutes * 60_000).toISOString();
}

function file({ id, at }: { id: string; at: string }): VendorItem {
  return { id, name: `${id}.pdf`, createdTime: at, modifiedTime: at };
}

function rejectedPage({ index }: { index: number }): Page {
  return { files: [file({ id: `future-${index}`, at: FUTURE })], nextPageToken: `page-${index + 1}` };
}

async function fakeFilesList(...args: unknown[]) {
  vendor.listCalls += 1;
  clock += vendor.listCallCost;
  const params = driveTestContext.listParams(args);
  if (vendor.mode === 'pages') {
    const index = params.pageToken ? Number(params.pageToken.replace('page-', '')) : 0;
    const page = vendor.pages[index] ?? { files: [] };
    return { status: 200, data: { incompleteSearch: false, nextPageToken: page.nextPageToken, files: page.files.map((item) => ({ kind: 'drive#file', mimeType: 'application/pdf', ...item })) } };
  }
  const visible = driveTestContext.sortForOrderBy({
    items: vendor.items.filter((item) => driveTestContext.matchesTimeQuery({ q: params.q ?? '', item })),
    orderBy: params.orderBy,
  });
  return { status: 200, data: { incompleteSearch: false, files: visible.map((item) => ({ kind: 'drive#file', mimeType: 'application/pdf', ...item })) } };
}

function hookContext({ store, isRepublish }: { store: TriggerStore; isRepublish?: boolean }) {
  return driveTestContext.triggerContext({ trigger, propsValue: baseProps, store, isRepublish });
}

const ids = (events: unknown[]) => driveTestContext.driveEvents(events).map((event) => event.id);

beforeEach(() => {
  vendor.mode = 'pages';
  vendor.pages = [];
  vendor.items = [];
  vendor.listCalls = 0;
  vendor.listCallCost = 0;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PIE-1148 New or Updated File test() sample paging', () => {
  it('pages until it finds an item on page 3', async () => {
    vendor.pages = [rejectedPage({ index: 0 }), { files: [], nextPageToken: 'page-2' }, { files: [file({ id: 'real', at: ago({ minutes: 60 }) })], nextPageToken: 'page-3' }, { files: [file({ id: 'older', at: ago({ minutes: 90 }) })] }];
    const store = driveTestContext.memoryStore();
    expect(ids(await trigger.test(hookContext({ store })))).toEqual(['real']);
    expect(vendor.listCalls).toBe(3);
  });

  it('stops at the sample page cap on an all-rejected backlog', async () => {
    vendor.pages = Array.from({ length: 30 }, (_, index) => rejectedPage({ index }));
    const store = driveTestContext.memoryStore();
    expect(await trigger.test(hookContext({ store }))).toEqual([]);
    expect(vendor.listCalls).toBe(common.testSampleMaxPages);
  });

  it('stops at the listing deadline and returns what it has', async () => {
    vendor.pages = Array.from({ length: 30 }, (_, index) => rejectedPage({ index }));
    vendor.listCallCost = 9_000;
    const store = driveTestContext.memoryStore();
    expect(await trigger.test(hookContext({ store }))).toEqual([]);
    expect(vendor.listCalls).toBe(3);
  });

  it('returns the newest items first', async () => {
    const older = ago({ minutes: 120 });
    const newest = ago({ minutes: 10 });
    const middle = ago({ minutes: 50 });
    vendor.pages = [{ files: [], nextPageToken: 'page-1' }, { files: [file({ id: 'older', at: older }), file({ id: 'newest', at: newest }), file({ id: 'middle', at: middle })] }];
    const store = driveTestContext.memoryStore();
    expect(ids(await trigger.test(hookContext({ store })))).toEqual(['newest', 'middle', 'older']);
  });

  it('leaves the run() multi-poll path unchanged', async () => {
    vendor.mode = 'live';
    vendor.items.push(file({ id: 'old', at: tick(1) }));
    const store = driveTestContext.memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(1);
    vendor.listCalls = 0;
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    vendor.items.push(file({ id: 'new', at: tick(1) }));
    tick(1);
    expect(ids(await trigger.run(hookContext({ store })))).toEqual(['new']);
    tick(1);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    tick(1);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });
});
