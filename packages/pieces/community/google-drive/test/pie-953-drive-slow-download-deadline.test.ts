/// <reference types="vitest/globals" />
import { drive_v3 } from '@googleapis/drive';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { DriveEvent, driveTestContext } from './drive-test-context';

let listed: { id: string; name: string; mimeType: string; createdTime: string; modifiedTime: string }[] = [];

const trigger = driveTestContext.asPolling(newOrUpdatedFile);
const TRIGGER_TIMEOUT_MS = 60_000;
const SLOW_DOWNLOAD_MS = 120_000;

function fakeDriveFetch() {
  return vi.fn(async (input: string | URL, init?: { signal?: AbortSignal }) => {
    const url = String(input);
    if (url.includes('fields=mimeType')) {
      return new Response(JSON.stringify({ mimeType: 'application/pdf' }), { headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('alt=media')) {
      if (url.includes('/files/big?')) {
        return await new Promise<Response>((resolve, reject) => {
          const timer = setTimeout(() => resolve(new Response('big file bytes')), SLOW_DOWNLOAD_MS);
          init?.signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('This operation was aborted', 'AbortError'));
          });
        });
      }
      return new Response('small file bytes');
    }
    throw new Error(`unexpected fetch ${url}`);
  });
}

function ctx(store: ReturnType<typeof driveTestContext.memoryStore>) {
  return driveTestContext.triggerContext({
    trigger,
    propsValue: { behaviourNote: undefined, parentFolder: undefined, file_types: undefined, include_file_content: true, include_team_drives: false },
    store,
  });
}

async function flushPending(isDone: () => boolean) {
  for (let i = 0; i < 20 && !isDone(); i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation(async () => ({ data: { files: listed } }));
  vi.stubGlobal('fetch', fakeDriveFetch());
  driveTestContext.routeFileLookupsToFetch();
  const changed = new Date('2026-10-01T11:59:30Z').toISOString();
  listed = [
    { id: 'a', name: 'a.pdf', mimeType: 'application/pdf', createdTime: changed, modifiedTime: changed },
    { id: 'big', name: 'big.pdf', mimeType: 'application/pdf', createdTime: changed, modifiedTime: changed },
    { id: 'c', name: 'c.pdf', mimeType: 'application/pdf', createdTime: changed, modifiedTime: changed },
  ];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('one slow download does not stop the poll from returning its files before the trigger timeout', async () => {
  const store = driveTestContext.memoryStore();
  store.write('lastPoll', Date.parse('2026-10-01T11:55:00Z'));
  let output: DriveEvent[] | undefined;
  const run = trigger.run(ctx(store)).then((items) => {
    output = driveTestContext.driveEvents(items);
  });

  await vi.advanceTimersByTimeAsync(TRIGGER_TIMEOUT_MS);
  await flushPending(() => output !== undefined);

  expect(store.read('lastPoll')).toBe(Date.parse('2026-10-01T11:59:30Z'));
  expect(output, 'run() still pending at the trigger timeout - the whole poll would be dropped').toBeDefined();
  const items = output ?? [];
  expect(items.map((f) => f.id).sort()).toEqual(['a', 'big', 'c']);
  const big = items.find((f) => f.id === 'big');
  expect(big?.content).toBeUndefined();
  expect(typeof big?.contentError).toBe('string');
  expect(items.filter((f) => f.id !== 'big').every((f) => typeof f.content === 'string')).toBe(true);

  await vi.advanceTimersByTimeAsync(SLOW_DOWNLOAD_MS);
  await run;
});

test('control: the same poll without the slow file returns all files before the timeout', async () => {
  listed = listed.filter((f) => f.id !== 'big');
  const store = driveTestContext.memoryStore();
  store.write('lastPoll', Date.parse('2026-10-01T11:55:00Z'));
  let output: DriveEvent[] | undefined;
  const run = trigger.run(ctx(store)).then((items) => {
    output = driveTestContext.driveEvents(items);
  });

  await vi.advanceTimersByTimeAsync(TRIGGER_TIMEOUT_MS);
  await flushPending(() => output !== undefined);

  expect(output).toBeDefined();
  const items = output ?? [];
  expect(items.map((f) => f.id).sort()).toEqual(['a', 'c']);
  expect(items.every((f) => typeof f.content === 'string')).toBe(true);
  await run;
});
