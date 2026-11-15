import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newFile } from '../src/lib/triggers/new-file';
import { newFolder } from '../src/lib/triggers/new-folder';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { driveTestContext, TriggerStore } from './drive-test-context';

type FakeFile = { id: string; name: string; mimeType: string; createdTime: string; modifiedTime: string };

const vendor = { files: new Array<FakeFile>() };
let clock = Date.parse('2026-11-01T10:00:00.000Z');
const at = (ms: number) => new Date(Date.parse('2026-11-01T10:00:00.000Z') + ms).toISOString();

function matches({ q, file }: { q: string; file: FakeFile }): boolean {
  const changed = /\(modifiedTime > '([^']+)' or createdTime > '([^']+)'\)/.exec(q);
  if (changed) {
    const t = Date.parse(changed[1]);
    return Date.parse(file.modifiedTime) > t || Date.parse(file.createdTime) > t;
  }
  const created = /createdTime (>=?) '([^']+)'/.exec(q);
  if (!created) return true;
  const t = Date.parse(created[2]);
  const c = Date.parse(file.createdTime);
  return created[1] === '>=' ? c >= t : c > t;
}

async function fakeFilesList(...args: unknown[]) {
  const params = driveTestContext.listParams(args);
  const key = params.orderBy?.startsWith('modifiedTime') ? 'modifiedTime' : 'createdTime';
  const files = vendor.files
    .filter((file) => matches({ q: params.q ?? '', file }))
    .sort((a, b) => Date.parse(b[key]) - Date.parse(a[key]));
  return { status: 200, data: { incompleteSearch: false, files } };
}

function add({ id, createdMs, mimeType = 'application/pdf' }: { id: string; createdMs: number; mimeType?: string }) {
  vendor.files.push({ id, name: id, mimeType, createdTime: at(createdMs), modifiedTime: at(createdMs) });
}

beforeEach(() => {
  vendor.files = [];
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(fakeFilesList);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const memory = () => driveTestContext.memoryStore();
const ids = (events: unknown) => driveTestContext.driveEvents(Array.isArray(events) ? events : []).map((event) => event.id).sort();

const triggers = [
  {
    name: 'New File',
    mimeType: 'application/pdf',
    run: async (store: TriggerStore, enable: boolean) => {
      const trigger = driveTestContext.asPolling(newFile);
      const ctx = driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false, include_file_content: false }, store });
      return enable ? trigger.onEnable(ctx) : trigger.run(ctx);
    },
  },
  {
    name: 'New Folder',
    mimeType: 'application/vnd.google-apps.folder',
    run: async (store: TriggerStore, enable: boolean) => {
      const trigger = driveTestContext.asPolling(newFolder);
      const ctx = driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false }, store });
      return enable ? trigger.onEnable(ctx) : trigger.run(ctx);
    },
  },
  {
    name: 'New or Updated File',
    mimeType: 'application/pdf',
    run: async (store: TriggerStore, enable: boolean) => {
      const trigger = driveTestContext.asPolling(newOrUpdatedFile);
      const ctx = driveTestContext.triggerContext({ trigger, propsValue: { behaviourNote: undefined, parentFolder: undefined, include_team_drives: false, file_types: undefined, include_file_content: false }, store });
      return enable ? trigger.onEnable(ctx) : trigger.run(ctx);
    },
  },
];

describe.each(triggers)('PIE-1067 $name: a file that shows up late is not lost', ({ run, mimeType }) => {
  it('fires a file with the same millisecond as the cursor that only appears in the next poll', async () => {
    const store = memory();
    await run(store, true);
    clock += 60_000;
    add({ id: 'first', createdMs: 30_123, mimeType });
    expect(ids(await run(store, false))).toEqual(['first']);
    add({ id: 'same-ms', createdMs: 30_123, mimeType });
    clock += 60_000;
    expect(ids(await run(store, false))).toEqual(['same-ms']);
    expect(ids(await run(store, false))).toEqual([]);
  });

  it('fires a file that Drive indexes after a newer file already moved the cursor', async () => {
    const store = memory();
    await run(store, true);
    clock += 60_000;
    add({ id: 'newer', createdMs: 50_000, mimeType });
    expect(ids(await run(store, false))).toEqual(['newer']);
    add({ id: 'indexed-late', createdMs: 20_000, mimeType });
    clock += 60_000;
    expect(ids(await run(store, false))).toEqual(['indexed-late']);
    expect(ids(await run(store, false))).toEqual([]);
  });
});
