import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { driveFileContent } from '../src/lib/common/file-content';
import { driveTestContext } from './drive-test-context';

const HUNG_FILE = 'hung';
const BUDGET_MS = 2_000;
const files = Array.from({ length: 20 }, (_, index) => ({
  id: index === 0 ? HUNG_FILE : `file-${String(index).padStart(2, '0')}`,
  name: `file-${index}.pdf`,
  mimeType: 'application/pdf',
}));

function fakeFetch() {
  return vi.fn(async (input: string | URL, init?: { signal?: AbortSignal }) => {
    const url = String(input);
    if (url.includes('fields=mimeType')) {
      return new Response(JSON.stringify({ mimeType: 'application/pdf' }), { headers: { 'content-type': 'application/json' } });
    }
    if (url.includes(`/files/${HUNG_FILE}?`)) {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('This operation was aborted', 'AbortError')));
      });
    }
    return new Response('bytes');
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));
  vi.stubGlobal('fetch', fakeFetch());
  driveTestContext.routeFileLookupsToFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Include File Content worker pool', () => {
  it('one hung download among the first five does not starve the other files', async () => {
    const run = driveFileContent.withFileContent({
      auth: driveTestContext.connection,
      files: driveTestContext.drainingFiles,
      items: files,
      includeFileContent: true,
      deadline: Date.now() + BUDGET_MS,
    });
    await vi.advanceTimersByTimeAsync(BUDGET_MS + 100);
    const events = driveTestContext.driveEvents(await run);
    expect(events.map((event) => event.id)).toEqual(files.map((file) => file.id));
    expect(events[0].contentError).toBe('Timed out before the file content could be downloaded');
    const others = events.slice(1);
    expect(others.filter((event) => typeof event.content === 'string')).toHaveLength(others.length);
  });

  it('keeps at most five downloads in flight', async () => {
    const inFlight = { now: 0, peak: 0 };
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('fields=mimeType')) {
        return new Response(JSON.stringify({ mimeType: 'application/pdf' }), { headers: { 'content-type': 'application/json' } });
      }
      inFlight.now += 1;
      inFlight.peak = Math.max(inFlight.peak, inFlight.now);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight.now -= 1;
      return new Response('bytes');
    }));
    const run = driveFileContent.withFileContent({
      auth: driveTestContext.connection,
      files: driveTestContext.drainingFiles,
      items: files.slice(1),
      includeFileContent: true,
      deadline: Date.now() + BUDGET_MS,
    });
    await vi.advanceTimersByTimeAsync(BUDGET_MS);
    const events = driveTestContext.driveEvents(await run);
    expect(events.every((event) => typeof event.content === 'string')).toBe(true);
    expect(inFlight.peak).toBeLessThanOrEqual(5);
    expect(inFlight.peak).toBeGreaterThan(1);
  });
});
