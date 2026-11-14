import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { driveFileContent } from '../src/lib/common/file-content';
import { driveTestContext } from './drive-test-context';

const vendor = { failuresLeft: 0, attemptsAt: new Array<number>() };

function installFakeDownload() {
  vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation(async () => ({ data: { mimeType: 'application/pdf' } }));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      vendor.attemptsAt.push(Date.now());
      if (vendor.failuresLeft > 0) {
        vendor.failuresLeft -= 1;
        return new Response('rate limited', { status: 429, statusText: 'Too Many Requests' });
      }
      return new Response('file bytes');
    })
  );
}

function download({ deadline }: { deadline: number }) {
  return driveFileContent.withFileContent({
    auth: driveTestContext.connection,
    files: driveTestContext.drainingFiles,
    items: [{ id: 'file-1', name: 'report.pdf' }],
    includeFileContent: true,
    deadline,
  });
}

beforeEach(() => {
  vendor.failuresLeft = 0;
  vendor.attemptsAt = [];
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date('2026-11-01T10:00:00.000Z'));
  vi.spyOn(Math, 'random').mockReturnValue(0);
  installFakeDownload();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PIE-1151 download retry respects the deadline', () => {
  it('waits for the backoff when time is left, then retries and succeeds', async () => {
    vendor.failuresLeft = 1;
    const pending = download({ deadline: Date.now() + 40_000 });
    await vi.runAllTimersAsync();
    const [result] = driveTestContext.driveEvents(await pending);
    expect(result.content).toBeDefined();
    expect(vendor.attemptsAt).toHaveLength(2);
    expect(vendor.attemptsAt[1] - vendor.attemptsAt[0]).toBeGreaterThanOrEqual(500);
  });

  it('stops without an extra call when the backoff would cross the deadline', async () => {
    vendor.failuresLeft = 5;
    const startedAt = Date.now();
    const deadline = startedAt + 300;
    const pending = download({ deadline });
    await vi.runAllTimersAsync();
    const [result] = driveTestContext.driveEvents(await pending);
    expect(result.contentError).toContain('429');
    expect(vendor.attemptsAt).toHaveLength(1);
    expect(Date.now()).toBeLessThan(deadline);
  });

  it('starts no attempt after the deadline', async () => {
    vendor.failuresLeft = 5;
    const deadline = Date.now() + 1_200;
    const pending = download({ deadline });
    await vi.runAllTimersAsync();
    const [result] = driveTestContext.driveEvents(await pending);
    expect(result.contentError).toBeDefined();
    expect(vendor.attemptsAt).toHaveLength(2);
    for (const at of vendor.attemptsAt) expect(at).toBeLessThan(deadline);
  });
});
