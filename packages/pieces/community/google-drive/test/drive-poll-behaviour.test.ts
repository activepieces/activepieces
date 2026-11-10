import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drivePoll } from '../src/lib/common/drive-poll';
import { newFile } from '../src/lib/triggers/new-file';
import { newFolder } from '../src/lib/triggers/new-folder';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { driveTestContext, TriggerStore } from './drive-test-context';

const FOLDER = 'application/vnd.google-apps.folder';
const PDF = 'application/pdf';
const START = Date.parse('2026-11-01T10:00:00.000Z');

type VendorItem = { id: string; name: string; mimeType: string; createdTime: string; modifiedTime: string; driveId: string };

const vendor: Vendor = {
  items: new Array<VendorItem>(),
  sharedDrives: new Array<string>(),
  incompleteAllDrives: false,
  pageSize: 1000,
  msPerSharedDriveCall: 0,
  slowCreatedPages: undefined,
  rejectPageTokens: false,
  queries: new Array<string>(),
};
let clock = START;

function at(ms: number): string {
  return new Date(START + ms).toISOString();
}

function add({ id, createdMs, mimeType, driveId = 'my-drive' }: { id: string; createdMs: number; mimeType: string; driveId?: string }) {
  vendor.items.push({ id, name: id, mimeType, createdTime: at(createdMs), modifiedTime: at(createdMs), driveId });
}

function edit({ id, modifiedMs }: { id: string; modifiedMs: number }) {
  const item = vendor.items.find((candidate) => candidate.id === id);
  if (item) item.modifiedTime = at(modifiedMs);
}

function compare({ value, op, bound }: { value: number; op: string; bound: number }): boolean {
  return op === '>=' ? value >= bound : value > bound;
}

function matches({ q, item }: { q: string; item: VendorItem }): boolean {
  if (q.includes(`mimeType='${FOLDER}'`) && item.mimeType !== FOLDER) return false;
  if (q.includes(`mimeType!='${FOLDER}'`) && item.mimeType === FOLDER) return false;
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

function inCorpus({ corpora, driveId, item }: { corpora?: string; driveId?: string; item: VendorItem }): boolean {
  if (corpora === 'allDrives') return !vendor.incompleteAllDrives || item.driveId === 'my-drive';
  if (corpora === 'drive') return item.driveId === driveId;
  return item.driveId === 'my-drive';
}

async function fakeFilesList(...args: unknown[]) {
  const params = driveTestContext.listParams(args);
  vendor.queries.push(params.q ?? '');
  if (vendor.rejectPageTokens && params.pageToken) {
    throw Object.assign(new Error('Invalid Value'), { status: 400 });
  }
  if (params.corpora === 'drive') clock += vendor.msPerSharedDriveCall;
  const key = params.orderBy?.startsWith('modifiedTime') ? 'modifiedTime' : 'createdTime';
  const slow = key === 'createdTime' ? vendor.slowCreatedPages : undefined;
  if (slow) clock += slow.ms;
  const pageSize = slow ? slow.pageSize : vendor.pageSize;
  const direction = params.orderBy?.endsWith(' desc') ? -1 : 1;
  const visible = vendor.items
    .filter((item) => inCorpus({ corpora: params.corpora, driveId: params.driveId, item }))
    .filter((item) => matches({ q: params.q ?? '', item }))
    .sort((a, b) => direction * (Date.parse(a[key]) - Date.parse(b[key])) || a.id.localeCompare(b.id));
  const offset = Number(params.pageToken ?? 0);
  const next = offset + pageSize < visible.length ? String(offset + pageSize) : undefined;
  return {
    status: 200,
    data: {
      incompleteSearch: params.corpora === 'allDrives' && vendor.incompleteAllDrives,
      nextPageToken: next,
      files: visible.slice(offset, offset + pageSize).map(({ driveId: _driveId, ...file }) => ({ kind: 'drive#file', ...file })),
    },
  };
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
  vendor.sharedDrives = [];
  vendor.incompleteAllDrives = false;
  vendor.pageSize = 1000;
  vendor.msPerSharedDriveCall = 0;
  vendor.slowCreatedPages = undefined;
  vendor.rejectPageTokens = false;
  vendor.queries = [];
  clock = START;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
  vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation((async () => ({ status: 200, data: { drives: vendor.sharedDrives.map((id) => ({ id })) } })));
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  driveTestContext.routeFileLookupsToFetch();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Hooks = {
  name: string;
  mimeType: string;
  enable: (args: { store: TriggerStore; isRepublish?: boolean }) => Promise<unknown>;
  run: (args: { store: TriggerStore; teamDrives?: boolean; withContent?: boolean }) => Promise<unknown[]>;
};

const triggers: Hooks[] = [
  {
    name: 'New File',
    mimeType: PDF,
    enable: async ({ store, isRepublish }) => {
      const trigger = driveTestContext.asPolling(newFile);
      return trigger.onEnable(driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false, include_file_content: false }, store, isRepublish }));
    },
    run: async ({ store, teamDrives = false, withContent = false }) => {
      const trigger = driveTestContext.asPolling(newFile);
      return trigger.run(driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: teamDrives, include_file_content: withContent }, store }));
    },
  },
  {
    name: 'New Folder',
    mimeType: FOLDER,
    enable: async ({ store, isRepublish }) => {
      const trigger = driveTestContext.asPolling(newFolder);
      return trigger.onEnable(driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false }, store, isRepublish }));
    },
    run: async ({ store, teamDrives = false }) => {
      const trigger = driveTestContext.asPolling(newFolder);
      return trigger.run(driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: teamDrives }, store }));
    },
  },
  {
    name: 'New or Updated File',
    mimeType: PDF,
    enable: async ({ store, isRepublish }) => {
      const trigger = driveTestContext.asPolling(newOrUpdatedFile);
      return trigger.onEnable(driveTestContext.triggerContext({ trigger, propsValue: { behaviourNote: undefined, parentFolder: undefined, include_team_drives: false, file_types: undefined, include_file_content: false }, store, isRepublish }));
    },
    run: async ({ store, teamDrives = false, withContent = false }) => {
      const trigger = driveTestContext.asPolling(newOrUpdatedFile);
      return trigger.run(driveTestContext.triggerContext({ trigger, propsValue: { behaviourNote: undefined, parentFolder: undefined, include_team_drives: teamDrives, file_types: undefined, include_file_content: withContent }, store }));
    },
  },
];

const ids = (events: unknown[]) => driveTestContext.driveEvents(events).map((event) => event.id);

async function pollTimes({ hooks, store, times, teamDrives }: { hooks: Hooks; store: TriggerStore; times: number; teamDrives?: boolean }): Promise<string[][]> {
  const results: string[][] = [];
  for (let poll = 0; poll < times; poll++) {
    clock += 60_000;
    results.push(ids(await hooks.run({ store, teamDrives })));
  }
  return results;
}

describe.each(triggers)('$name poll', (hooks) => {
  it('fires once per item across polls and a republish', async () => {
    add({ id: 'old', createdMs: -60_000, mimeType: hooks.mimeType });
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual([]);
    add({ id: 'a', createdMs: 61_000, mimeType: hooks.mimeType });
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(['a']);
    expect(ids(await hooks.run({ store }))).toEqual([]);
    await hooks.enable({ store, isRepublish: true });
    expect(ids(await hooks.run({ store }))).toEqual([]);
    add({ id: 'b', createdMs: 150_000, mimeType: hooks.mimeType });
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(['b']);
    expect(ids(await hooks.run({ store }))).toEqual([]);
  });

  it('a file indexed late fires once and not again on the next two polls', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    add({ id: 'newer', createdMs: 100_000, mimeType: hooks.mimeType });
    clock += 120_000;
    expect(ids(await hooks.run({ store }))).toEqual(['newer']);
    add({ id: 'late', createdMs: 10_000, mimeType: hooks.mimeType });
    expect(await pollTimes({ hooks, store, times: 3 })).toEqual([['late'], [], []]);
  });

  it('a flow enabled on the old version (lastPoll only) fires nothing old after the upgrade', async () => {
    add({ id: 'before', createdMs: -30_000, mimeType: hooks.mimeType });
    add({ id: 'at-cursor', createdMs: 0, mimeType: hooks.mimeType });
    const store = driveTestContext.memoryStore();
    store.write('lastPoll', START);
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual([]);
    add({ id: 'new', createdMs: 70_000, mimeType: hooks.mimeType });
    expect(await pollTimes({ hooks, store, times: 3 })).toEqual([['new'], [], []]);
  });

  it('a backlog of three times the per-poll cap drains oldest first, each item once', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const cap = drivePoll.maxItemsPerPoll({ includeFileContent: false });
    const backlog = Array.from({ length: cap * 3 }, (_, index) => `bulk-${String(index).padStart(5, '0')}`);
    backlog.forEach((id, index) => add({ id, createdMs: 1_000 + index, mimeType: hooks.mimeType }));
    const polls = await pollTimes({ hooks, store, times: 5 });
    expect(polls.map((poll) => poll.length)).toEqual([cap, cap, cap, 0, 0]);
    expect(polls.flat()).toEqual(backlog);
  });

  it('a tie at the cursor and the late-index window survive a seen-set overflow, and the store stays small', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const perPoll = 450;
    const fired: string[] = [];
    for (let poll = 0; poll < 6; poll++) {
      const base = 1_000 + poll * 10_000;
      Array.from({ length: perPoll }, (_, index) => `p${poll}-${index}`).forEach((id, index) => add({ id, createdMs: base + index, mimeType: hooks.mimeType }));
      clock = START + base + 9_000;
      fired.push(...ids(await hooks.run({ store })));
    }
    expect(fired).toHaveLength(perPoll * 6);
    expect(new Set(fired).size).toBe(perPoll * 6);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('late-index re-checks are paused'));
    expect(JSON.stringify(store.read('driveRecent')).length).toBeLessThan(512 * 1024);
    const cursor = Number(store.read('lastPoll'));
    add({ id: 'tie', createdMs: cursor - START, mimeType: hooks.mimeType });
    expect(await pollTimes({ hooks, store, times: 3 })).toEqual([['tie'], [], []]);
  });

  it('with Include Team Drives and a partial allDrives search, a truncated shared drive holds back newer files until the next poll', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    vendor.incompleteAllDrives = true;
    vendor.sharedDrives = ['sd-1'];
    vendor.pageSize = 10;
    vendor.msPerSharedDriveCall = 6_000;
    const shared = Array.from({ length: 60 }, (_, index) => `sd-${String(index).padStart(3, '0')}`);
    shared.forEach((id, index) => add({ id, createdMs: 1_000 + index, mimeType: hooks.mimeType, driveId: 'sd-1' }));
    add({ id: 'mine-late', createdMs: 5_000, mimeType: hooks.mimeType });
    const polls = await pollTimes({ hooks, store, times: 4, teamDrives: true });
    const all = polls.flat();
    expect(all).toEqual([...shared, 'mine-late']);
    expect(polls[0].length).toBeLessThan(all.length);
  });
});

describe.each(triggers)('$name after a rollback and a re-upgrade', (hooks) => {
  it('a version-0.14.0 poll, then an older-version poll that moves lastPoll, then a republish, then a poll that fires nothing old', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    add({ id: 'first', createdMs: 10_000, mimeType: hooks.mimeType });
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(['first']);
    expect(store.read('driveRecent')).toEqual(expect.objectContaining({ cursor: store.read('lastPoll') }));
    const sentByOlderVersion = ['older-1', 'older-2', 'older-3'];
    sentByOlderVersion.forEach((id, index) => add({ id, createdMs: 70_000 + index * 1_000, mimeType: hooks.mimeType }));
    clock += 60_000;
    store.write('lastPoll', Date.parse(at(72_000)));
    await hooks.enable({ store, isRepublish: true });
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual([]);
    add({ id: 'after-upgrade', createdMs: clock - START, mimeType: hooks.mimeType });
    expect(await pollTimes({ hooks, store, times: 2 })).toEqual([['after-upgrade'], []]);
  });
});

describe.each(triggers)('$name with Include Team Drives and more shared drives than one check can search', (hooks) => {
  it('carries the unsearched drives over to the next checks and fires every file once', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    vendor.incompleteAllDrives = true;
    vendor.msPerSharedDriveCall = 2_000;
    vendor.sharedDrives = Array.from({ length: 40 }, (_, index) => `drive-${String(index).padStart(2, '0')}`);
    const shared = vendor.sharedDrives.map((driveId, index) => {
      const id = `${driveId}-file`;
      add({ id, createdMs: 1_000 + index, mimeType: hooks.mimeType, driveId });
      return id;
    });
    add({ id: 'mine', createdMs: 500, mimeType: hooks.mimeType });
    const cursorBefore = Number(store.read('lastPoll'));
    clock += 60_000;
    const first = ids(await hooks.run({ store, teamDrives: true }));
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThan(shared.length + 1);
    expect(store.read('lastPoll')).toBe(cursorBefore);
    const rest = await pollTimes({ hooks, store, times: 10, teamDrives: true });
    const fired = [...first, ...rest.flat()];
    expect([...fired].sort()).toEqual(['mine', ...shared].sort());
    expect(Number(store.read('lastPoll'))).toBeGreaterThan(cursorBefore);
    add({ id: 'later', createdMs: clock - START, mimeType: hooks.mimeType, driveId: 'drive-39' });
    const after = await pollTimes({ hooks, store, times: 10, teamDrives: true });
    expect(after.flat()).toEqual(['later']);
  });
});

describe('New or Updated File poll', () => {
  const hooks = triggers[2];

  it('an edit to a file that already fired inside the re-check window fires again as updated', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    add({ id: 'doc', createdMs: 10_000, mimeType: PDF });
    clock += 60_000;
    const first = driveTestContext.driveEvents(await hooks.run({ store }));
    expect(first.map((event) => [event.id, event.changeType])).toEqual([['doc', 'created']]);
    edit({ id: 'doc', modifiedMs: 70_000 });
    clock += 60_000;
    const second = driveTestContext.driveEvents(await hooks.run({ store }));
    expect(second.map((event) => [event.id, event.changeType])).toEqual([['doc', 'updated']]);
    expect(await pollTimes({ hooks, store, times: 2 })).toEqual([[], []]);
  });

  it.each([
    { withContent: false, polls: 20 },
    { withContent: true, polls: 70 },
  ])('3,000 files created now with a years-old modifiedTime each fire once and the cursor advances (content $withContent)', async ({ withContent, polls }) => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const yearsAgo = -3 * 365 * 24 * 3_600_000;
    const files = Array.from({ length: 3_000 }, (_, index) => `kept-mtime-${String(index).padStart(4, '0')}`);
    files.forEach((id, index) => {
      add({ id, createdMs: 1_000 + index, mimeType: PDF });
      edit({ id, modifiedMs: yearsAgo + index });
    });
    const fired: string[] = [];
    const cursors: number[] = [];
    for (let poll = 0; poll < polls; poll++) {
      clock += 60_000;
      fired.push(...ids(await hooks.run({ store, withContent })));
      cursors.push(Number(store.read('lastPoll')));
    }
    expect(fired).toEqual(files);
    expect(cursors[0]).toBeGreaterThan(START);
    expect(cursors.at(-1)).toBe(Date.parse(at(1_000 + 2_999)));
    const seen = store.read('driveRecent');
    expect(JSON.stringify(seen).length).toBeLessThan(512 * 1024);
  });

  it.each([
    { withContent: false, polls: 6 },
    { withContent: true, polls: 25 },
  ])('1,001 imported files sharing one createdTime and edited later each fire once, then later changes still fire (content $withContent)', async ({ withContent, polls }) => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const imported = Array.from({ length: 1_001 }, (_, index) => `imported-${String(index).padStart(4, '0')}`);
    imported.forEach((id, index) => {
      add({ id, createdMs: 5_000, mimeType: PDF });
      edit({ id, modifiedMs: 10_000 + index });
    });
    const fired: string[] = [];
    for (let poll = 0; poll < polls; poll++) {
      clock += 60_000;
      fired.push(...ids(await hooks.run({ store, withContent })));
    }
    expect(fired).toEqual(imported);
    add({ id: 'after-import', createdMs: clock - START, mimeType: PDF });
    clock += 60_000;
    expect(ids(await hooks.run({ store, withContent }))).toEqual(['after-import']);
    expect(ids(await hooks.run({ store, withContent }))).toEqual([]);
  });

  it('a truncated listing moves the cursor to the watermark, not to the newest file it sent', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].forEach((id, index) => add({ id, createdMs: 1_000 * (index + 1), mimeType: PDF }));
    edit({ id: 'c4', modifiedMs: 50_000 });
    vendor.slowCreatedPages = { pageSize: 2, ms: 13_000 };
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(['c1', 'c2', 'c3']);
    expect(store.read('lastPoll')).toBe(Date.parse(at(4_000)));
    vendor.slowCreatedPages = undefined;
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(['c5', 'c6', 'c4']);
    expect(ids(await hooks.run({ store }))).toEqual([]);
  });

  it('queries with millisecond precision and >=, ordered oldest first', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    clock += 60_000;
    await hooks.run({ store });
    expect(vendor.queries).toContainEqual(expect.stringContaining(`modifiedTime >= '${new Date(START + 1).toISOString()}'`));
    expect(vendor.queries).toContainEqual(expect.stringContaining(`createdTime >= '${new Date(START + 1).toISOString()}'`));
  });
});

describe.each([
  { hooks: triggers[0], keepOldModifiedTime: false },
  { hooks: triggers[2], keepOldModifiedTime: true },
])('$hooks.name poll when the deadline cuts inside one timestamp group', ({ hooks, keepOldModifiedTime }) => {
  it.each([{ withContent: false }, { withContent: true }])('resumes from the saved page and fires every file once (content $withContent)', async ({ withContent }) => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const group = Array.from({ length: 60 }, (_, index) => `same-ms-${String(index).padStart(2, '0')}`);
    group.forEach((id, index) => {
      add({ id, createdMs: 5_000, mimeType: PDF });
      if (keepOldModifiedTime) edit({ id, modifiedMs: -3 * 365 * 24 * 3_600_000 + index });
    });
    vendor.slowCreatedPages = { pageSize: 10, ms: 13_000 };
    const perPoll: number[] = [];
    const fired: string[] = [];
    for (let poll = 0; poll < 3; poll++) {
      clock += 60_000;
      const sent = ids(await hooks.run({ store, withContent }));
      perPoll.push(sent.length);
      fired.push(...sent);
    }
    expect(perPoll).toEqual([20, 20, 20]);
    expect(fired).toEqual(group);
    expect(store.read('lastPoll')).toBe(Date.parse(at(5_000)));
    add({ id: 'after-group', createdMs: clock - START, mimeType: PDF });
    const later: string[] = [];
    for (let poll = 0; poll < 4; poll++) {
      clock += 60_000;
      later.push(...ids(await hooks.run({ store, withContent })));
    }
    expect(later).toEqual(['after-group']);
    expect(Number(store.read('lastPoll'))).toBeGreaterThan(Date.parse(at(5_000)));
  });

  it('falls back to a fresh listing when Drive rejects the saved page token', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const group = Array.from({ length: 30 }, (_, index) => `same-ms-${String(index).padStart(2, '0')}`);
    group.forEach((id, index) => {
      add({ id, createdMs: 5_000, mimeType: PDF });
      if (keepOldModifiedTime) edit({ id, modifiedMs: -3 * 365 * 24 * 3_600_000 + index });
    });
    vendor.slowCreatedPages = { pageSize: 10, ms: 13_000 };
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(group.slice(0, 20));
    vendor.rejectPageTokens = true;
    vendor.slowCreatedPages = undefined;
    clock += 60_000;
    expect(ids(await hooks.run({ store }))).toEqual(group.slice(20));
    expect(ids(await hooks.run({ store }))).toEqual([]);
  });
});

describe('New File poll with Include File Content', () => {
  const hooks = triggers[0];

  it('sends at most the content cap per poll and the rest on the next polls, each with content', async () => {
    const store = driveTestContext.memoryStore();
    await hooks.enable({ store });
    const cap = drivePoll.maxItemsPerPoll({ includeFileContent: true });
    const files = Array.from({ length: cap + 10 }, (_, index) => `f-${String(index).padStart(3, '0')}`);
    files.forEach((id, index) => add({ id, createdMs: 1_000 + index, mimeType: PDF }));
    const polls: unknown[][] = [];
    for (let poll = 0; poll < 3; poll++) {
      clock += 60_000;
      polls.push(await hooks.run({ store, withContent: true }));
    }
    expect(polls.map((poll) => poll.length)).toEqual([cap, 10, 0]);
    const events = driveTestContext.driveEvents(polls.flat());
    expect(events.map((event) => event.id)).toEqual(files);
    expect(events.every((event) => typeof event.content === 'string')).toBe(true);
  });
});

type SlowPages = { pageSize: number; ms: number };

type Vendor = {
  items: VendorItem[];
  sharedDrives: string[];
  incompleteAllDrives: boolean;
  pageSize: number;
  msPerSharedDriveCall: number;
  slowCreatedPages: SlowPages | undefined;
  rejectPageTokens: boolean;
  queries: string[];
};
