import { drive_v3 } from '@googleapis/drive';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { common } from '../src/lib/common';
import { newOrUpdatedFile } from '../src/lib/triggers/new-or-updated-file';
import { DriveEvent, driveTestContext } from './drive-test-context';

const trigger = driveTestContext.asPolling(newOrUpdatedFile);
const MIN_BACKOFF_MS = 500;

async function runPoll({ listingTakesMs, largeFiles, largeDownloadTakesMs }: { listingTakesMs: number; largeFiles: number; largeDownloadTakesMs: number }) {
  const realBase = Date.now();
  const perf0 = performance.now();
  let skew = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => realBase + skew + (performance.now() - perf0));

  const files = [
    ...Array.from({ length: largeFiles }, (_, i) => ({
      id: `large-${i}`,
      name: `scan-${i}.pdf`,
      mimeType: 'application/pdf',
      createdTime: new Date(realBase - 90_000).toISOString(),
      modifiedTime: new Date(realBase - 60_000 + i).toISOString(),
    })),
    {
      id: 'file-1',
      name: 'report.pdf',
      mimeType: 'application/pdf',
      createdTime: new Date(realBase - 60_000).toISOString(),
      modifiedTime: new Date(realBase - 30_000).toISOString(),
    },
  ];

  let listed = false;
  vi.spyOn(common, 'getFiles').mockImplementation(async () => {
    if (!listed) {
      listed = true;
      skew += listingTakesMs;
    }
    return { files, truncated: false };
  });
  vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation(async () => ({ data: { mimeType: 'application/pdf' } }));

  const downloadAttemptsAt: number[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    if (url.includes('/files/large-')) {
      const done = listingTakesMs + largeDownloadTakesMs;
      skew = Math.max(skew, done - (performance.now() - perf0));
      return new Response('large file bytes', { status: 200 });
    }
    downloadAttemptsAt.push(performance.now());
    return new Response('rate limited', { status: 429, statusText: 'Too Many Requests' });
  });

  const store = driveTestContext.memoryStore();
  store.write('lastPoll', realBase - 120_000);
  const output = driveTestContext.driveEvents(
    await trigger.run(
      driveTestContext.triggerContext({
        trigger,
        propsValue: { behaviourNote: undefined, parentFolder: undefined, include_file_content: true, include_team_drives: false, file_types: [] },
        store,
      })
    )
  );
  const failing: DriveEvent | undefined = output.find((file) => file.id === 'file-1');
  const gaps = downloadAttemptsAt.slice(1).map((at, i) => at - downloadAttemptsAt[i]);
  return { output, failing, attempts: downloadAttemptsAt.length, gaps, deadlineAt: perf0 + 40_000 - skew, attemptsAt: downloadAttemptsAt };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('PIE-1151 Drive file content download backs off between retries', () => {
  it('with budget to spare, each retry waits at least the backoff', async () => {
    const { output, failing, attempts, gaps } = await runPoll({ listingTakesMs: 0, largeFiles: 0, largeDownloadTakesMs: 0 });
    expect(output).toHaveLength(1);
    expect(failing?.contentError).toBeDefined();
    expect(attempts).toBe(3);
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(MIN_BACKOFF_MS - 5);
  });

  it('near the deadline, no retry fires without waiting the backoff and the error is returned', async () => {
    const { output, failing, attempts, gaps } = await runPoll({ listingTakesMs: 20_000, largeFiles: 5, largeDownloadTakesMs: 19_700 });
    expect(output).toHaveLength(6);
    expect(output.filter((file) => typeof file.content === 'string')).toHaveLength(5);
    expect(failing?.contentError).toBeDefined();
    expect(attempts).toBe(1);
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(MIN_BACKOFF_MS - 5);
  });
});
