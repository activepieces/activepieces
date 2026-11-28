import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newFile } from '../src/lib/triggers/new-file';
import { driveTestContext } from './drive-test-context';

const PAGE_SIZE = 10;
const SECONDS_PER_PAGE = 6;
const START = Date.parse('2026-11-01T10:00:00.000Z');

const vendor = { files: new Array<{ id: string; name: string; createdTime: string; modifiedTime: string }>() };
let clock = START;

async function slowFilesList(...args: unknown[]) {
  const params = driveTestContext.listParams(args);
  clock += SECONDS_PER_PAGE * 1000;
  const created = /createdTime (>=?) '([^']+)'/.exec(params.q ?? '');
  const after = created ? Date.parse(created[2]) : 0;
  const ascending = params.orderBy === 'createdTime' || params.orderBy === 'createdTime asc';
  const visible = vendor.files
    .filter((file) => Date.parse(file.createdTime) > after)
    .sort((a, b) => (ascending ? 1 : -1) * (Date.parse(a.createdTime) - Date.parse(b.createdTime)));
  const offset = Number(params.pageToken ?? 0);
  const next = offset + PAGE_SIZE < visible.length ? String(offset + PAGE_SIZE) : undefined;
  return { status: 200, data: { incompleteSearch: false, nextPageToken: next, files: visible.slice(offset, offset + PAGE_SIZE) } };
}

beforeEach(() => {
  vendor.files = [];
  clock = START;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(slowFilesList);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PIE-1072 New File: a backlog bigger than one poll can list', () => {
  it('makes progress poll after poll and fires every file exactly once', async () => {
    const trigger = driveTestContext.asPolling(newFile);
    const store = driveTestContext.memoryStore();
    const ctx = () => driveTestContext.triggerContext({ trigger, propsValue: { parentFolder: undefined, include_team_drives: false, include_file_content: false }, store });
    await trigger.onEnable(ctx());
    const backlog = Array.from({ length: PAGE_SIZE * 8 }, (_, index) => `bulk-${index}`);
    backlog.forEach((id, index) => {
      const time = new Date(START + 1000 + index).toISOString();
      vendor.files.push({ id, name: id, createdTime: time, modifiedTime: time });
    });

    const fired: string[] = [];
    for (let poll = 0; poll < 6; poll++) {
      clock += 60_000;
      const result = await trigger.run(ctx()).catch(() => []);
      fired.push(...driveTestContext.driveEvents(result).map((event) => event.id));
    }

    expect(fired.length).toBe(backlog.length);
    expect(new Set(fired)).toEqual(new Set(backlog));
  });
});
