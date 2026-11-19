/// <reference types="vitest/globals" />
import { drive_v3 } from '@googleapis/drive';
import { newFile } from '../src/lib/triggers/new-file';
import { driveTestContext } from './drive-test-context';

let listed: { id: string; name: string; mimeType: string; createdTime: string }[] = [];

const trigger = driveTestContext.asPolling(newFile);
const mimeById: Record<string, string> = { a: 'application/pdf', form: 'application/vnd.google-apps.form', c: 'application/pdf' };

function fakeDriveFetch() {
  return vi.fn(async (input: string | URL) => {
    const url = String(input);
    const id = /\/files\/([^/?]+)/.exec(url)?.[1] ?? '';
    if (url.includes('fields=mimeType')) {
      return new Response(JSON.stringify({ mimeType: mimeById[id] }), { headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('alt=media')) {
      if (mimeById[id].startsWith('application/vnd.google-apps.')) {
        return new Response(JSON.stringify({ error: { code: 403, message: 'Only files with binary content can be downloaded. Use Export with Docs Editors files.', errors: [{ reason: 'fileNotDownloadable' }] } }), { status: 403, statusText: 'Forbidden' });
      }
      return new Response(`bytes of ${id}`);
    }
    throw new Error(`unexpected fetch ${url}`);
  });
}

function ctx(store: ReturnType<typeof driveTestContext.memoryStore>) {
  return driveTestContext.triggerContext({
    trigger,
    propsValue: { parentFolder: undefined, include_file_content: true, include_team_drives: false },
    store,
  });
}

beforeEach(() => {
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(async () => ({ data: { files: listed } }));
  vi.stubGlobal('fetch', fakeDriveFetch());
  driveTestContext.routeFileLookupsToFetch();
  const created = new Date(Date.now() - 30_000).toISOString();
  listed = [
    { id: 'a', name: 'a.pdf', mimeType: 'application/pdf', createdTime: created },
    { id: 'form', name: 'Signup form', mimeType: 'application/vnd.google-apps.form', createdTime: created },
    { id: 'c', name: 'c.pdf', mimeType: 'application/pdf', createdTime: created },
  ];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('one file whose content cannot be downloaded does not drop the other new files', async () => {
  const store = driveTestContext.memoryStore();
  store.write('lastPoll', Date.now() - 5 * 60_000);
  const outcome = await trigger.run(ctx(store)).then(
    (items) => ({ items: driveTestContext.driveEvents(items), error: undefined }),
    (error: unknown) => ({ items: [], error }),
  );

  expect(store.read('lastPoll')).toBeGreaterThan(Date.now() - 5 * 60_000);
  expect(outcome.error, 'run() threw - the poll fails and all three new files are lost').toBeUndefined();
  expect(outcome.items.map((f) => f.id).sort()).toEqual(['a', 'c', 'form']);
  expect(outcome.items.filter((f) => f.id !== 'form').every((f) => typeof f.content === 'string')).toBe(true);
});

test('control: the same poll without the Google Form delivers both files with content', async () => {
  listed = listed.filter((f) => f.id !== 'form');
  const store = driveTestContext.memoryStore();
  store.write('lastPoll', Date.now() - 5 * 60_000);
  const items = driveTestContext.driveEvents(await trigger.run(ctx(store)));
  expect(items.map((f) => f.id).sort()).toEqual(['a', 'c']);
  expect(items.every((f) => typeof f.content === 'string')).toBe(true);
});
