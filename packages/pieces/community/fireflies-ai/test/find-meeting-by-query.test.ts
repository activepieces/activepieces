import { afterEach, describe, expect, test, vi } from 'vitest';
import { findMeetingByQueryAction } from '../src/lib/actions/find-meeting-by-query';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('find_meeting_by_query', () => {
  test('maps the deprecated filters onto current arguments', async () => {
    const seen = stubFetch({ pageSizes: [2] });
    await findMeetingByQueryAction.run(
      fakeContext({ props: { title: ' Weekly ', participantEmail: 'p@example.com', date: '2026-03-14T21:00:00.000Z' } }),
    );
    expect(seen).toHaveLength(1);
    const { query, variables } = seen[0];
    expect(variables).toEqual({
      keyword: 'Weekly',
      participants: ['p@example.com'],
      fromDate: '2026-03-14T21:00:00.000Z',
      toDate: '2026-03-15T20:59:59.999Z',
      limit: 50,
      skip: 0,
    });
    expect(query).toContain('scope: "title"');
    expect(query).toContain('keyword: $keyword');
    expect(query).toContain('participants: $participants');
    expect(query).not.toMatch(/\btitle: \$/);
    expect(query).not.toContain('participant_email');
    expect(query).not.toMatch(/\bdate: \$/);
  });

  test('maps Host Email to host_email', async () => {
    const seen = stubFetch({ pageSizes: [0] });
    await findMeetingByQueryAction.run(fakeContext({ props: { hostEmail: 'host@example.com' } }));
    expect(seen[0].variables).toEqual({ hostEmail: 'host@example.com', limit: 50, skip: 0 });
    expect(seen[0].query).toContain('host_email: $hostEmail');
  });

  test('refuses Host Email together with Participant Email before any request (Fireflies rejects the pair)', async () => {
    const seen = stubFetch({ pageSizes: [0] });
    await expect(findMeetingByQueryAction.run(fakeContext({ props: { hostEmail: 'host@example.com', participantEmail: 'p@example.com' } }))).rejects.toThrow('Host Email with Participant Email');
    expect(seen).toHaveLength(0);
  });

  test('sends no filter arguments when none are set', async () => {
    const seen = stubFetch({ pageSizes: [0] });
    const output = await findMeetingByQueryAction.run(fakeContext({ props: {} }));
    expect(seen[0].variables).toEqual({ limit: 50, skip: 0 });
    expect(seen[0].query).not.toContain('scope:');
    expect(output).toEqual({ found: false, meetings: [] });
  });

  test('pages with skip and stops on a short page', async () => {
    const seen = stubFetch({ pageSizes: [50, 50, 7] });
    const output = await findMeetingByQueryAction.run(fakeContext({ props: { hostEmail: 'h@example.com' } }));
    expect(seen.map((request) => request.variables['skip'])).toEqual([0, 50, 100]);
    expect(output.found).toBe(true);
    expect(output.meetings).toHaveLength(107);
  });

  test('throws instead of truncating after 20 full pages', async () => {
    const seen = stubFetch({ pageSizes: Array.from({ length: 30 }, () => 50) });
    await expect(findMeetingByQueryAction.run(fakeContext({ props: {} }))).rejects.toThrow('At least 1000 meetings match');
    expect(seen).toHaveLength(20);
  });

  test('a local-midnight date (15 Mar in UTC+3) is not shifted to the previous UTC day', async () => {
    const seen = stubFetch({ pageSizes: [0] });
    await findMeetingByQueryAction.run(fakeContext({ props: { date: '2026-03-14T21:00:00.000Z' } }));
    expect(seen[0].variables['fromDate']).toBe('2026-03-14T21:00:00.000Z');
    expect(seen[0].variables['toDate']).toBe('2026-03-15T20:59:59.999Z');
    stubFetch({ pageSizes: [0] });
    await expect(findMeetingByQueryAction.run(fakeContext({ props: { date: 'not a date' } }))).rejects.toThrow('valid date');
  });

  test('stops at the 240 s run deadline instead of returning partial results', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-03-15T00:00:00Z'));
    const seen = stubFetch({ pageSizes: [50], delayMs: 50_000 });
    await expect(findMeetingByQueryAction.run(fakeContext({ props: {} }))).rejects.toThrow('Narrow your filters');
    expect(seen).toHaveLength(5);
  });

  test('gives the last request only the time left and aborts it at the deadline', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse('2026-03-15T00:00:00Z'));
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        calls++;
        if (calls === 1) {
          vi.setSystemTime(Date.now() + 200_000);
          return new Response(JSON.stringify({ data: { transcripts: Array.from({ length: 50 }, (_, index) => ({ id: `m-${index}` })) } }), { status: 200 });
        }
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      }),
    );
    const outcome = findMeetingByQueryAction.run(fakeContext({ props: {} })).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(39_000);
    expect(calls).toBe(2);
    await vi.advanceTimersByTimeAsync(1_500);
    const error = await outcome;
    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').toContain('Narrow your filters');
  });

  test('a GraphQL error fails the step instead of returning found:false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: null, errors: [{ message: 'Bad args', code: 'invalid_arguments' }] }), { status: 200 })),
    );
    await expect(findMeetingByQueryAction.run(fakeContext({ props: {} }))).rejects.toThrow('invalid_arguments');
  });
});

function fakeContext({ props }: { props: Record<string, unknown> }): Parameters<typeof findMeetingByQueryAction.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: 'key' }, propsValue: props });
}

function stubFetch({ pageSizes, delayMs }: { pageSizes: number[]; delayMs?: number }): SeenGraphql[] {
  const seen: SeenGraphql[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const query = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'query') : '';
      const variables = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'variables') : {};
      seen.push({ query: String(query), variables: variables !== null && typeof variables === 'object' ? Object.fromEntries(Object.entries(variables)) : {} });
      if (delayMs !== undefined) {
        vi.setSystemTime(Date.now() + delayMs);
      }
      const size = pageSizes[Math.min(seen.length - 1, pageSizes.length - 1)];
      const transcripts = Array.from({ length: size }, (_, index) => ({ id: `m-${seen.length}-${index}` }));
      return new Response(JSON.stringify({ data: { transcripts } }), { status: 200 });
    }),
  );
  return seen;
}

type SeenGraphql = { query: string; variables: Record<string, unknown> };
