import { afterEach, describe, expect, test, vi } from 'vitest';
import { searchMeetingsAction, searchMeetingsInternals } from '../src/lib/actions/ai/search-meetings';
import { firefliesInput } from '../src/lib/common/props';

afterEach(() => vi.unstubAllGlobals());

const EMPTY = {
  keyword: undefined,
  scope: undefined,
  fromDate: undefined,
  toDate: undefined,
  organizers: undefined,
  participants: undefined,
  mine: undefined,
  userId: undefined,
  channelId: undefined,
  limit: undefined,
  skip: undefined,
};

describe('search_meetings request', () => {
  test('defaults to limit 20, skip 0 and sends nothing else', () => {
    const request = searchMeetingsInternals.buildSearch(EMPTY);
    expect(request.values).toEqual({ limit: 20, skip: 0 });
    expect(request.scope).toBeUndefined();
  });

  test('empty arrays are not sent; filled ones are', () => {
    expect(searchMeetingsInternals.buildSearch({ ...EMPTY, organizers: [], participants: ['', ' '] }).values).toEqual({ limit: 20, skip: 0 });
    const request = searchMeetingsInternals.buildSearch({ ...EMPTY, organizers: ['a@example.com'], participants: ['b@example.com', 'b@example.com'] });
    expect(request.values['organizers']).toEqual(['a@example.com']);
    expect(request.values['participants']).toEqual(['b@example.com']);
  });

  test('maps keyword, scope, owner, channel and mine', () => {
    const request = searchMeetingsInternals.buildSearch({ ...EMPTY, keyword: 'budget', scope: 'sentences', userId: 'u1', channelId: 'c1', mine: 'no' });
    expect(request.values).toEqual({ keyword: 'budget', userId: 'u1', channelId: 'c1', mine: false, limit: 20, skip: 0 });
    expect(request.scope).toBe('sentences');
    expect(request.specs.map((spec) => spec.argument)).toEqual(['keyword', 'mine', 'user_id', 'channel_id', 'limit', 'skip']);
  });

  test('rejects owner-filter combinations Fireflies refuses (live: invalid_arguments)', () => {
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, mine: 'yes', userId: 'u1' })).toThrow('not both');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, mine: 'yes', organizers: ['a@example.com'] })).toThrow('does not combine an owner filter');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, userId: 'u1', participants: ['a@example.com'] })).toThrow('does not combine an owner filter');
    expect(searchMeetingsInternals.buildSearch({ ...EMPTY, organizers: ['a@example.com'], participants: ['b@example.com'] }).values).toMatchObject({ organizers: ['a@example.com'], participants: ['b@example.com'] });
  });

  test('rejects an unknown scope or a scope without a keyword', () => {
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, keyword: 'x', scope: 'everything' })).toThrow('Search In must be one of');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, scope: 'title' })).toThrow('only applies together with a Keyword');
  });

  test('enforces limit bounds', () => {
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, limit: 0 })).toThrow('between 1 and 50');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, limit: 51 })).toThrow('between 1 and 50');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, limit: 2.5 })).toThrow('between 1 and 50');
    expect(searchMeetingsInternals.buildSearch({ ...EMPTY, limit: '50' }).limit).toBe(50);
  });

  test('dates: strict ISO, real calendar days, whole-day bounds for date-only values', () => {
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, fromDate: '2026-02-30' })).toThrow('not a real calendar date');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, fromDate: 'next tuesday' })).toThrow('ISO 8601');
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, fromDate: '2026-03-02', toDate: '2026-03-01' })).toThrow('before To Date');
    const request = searchMeetingsInternals.buildSearch({ ...EMPTY, fromDate: '2026-03-01', toDate: '2026-03-01T10:00:00+02:00' });
    expect(request.values['fromDate']).toBe('2026-03-01T00:00:00.000Z');
    expect(request.values['toDate']).toBe('2026-03-01T08:00:00.000Z');
    expect(firefliesInput.strictIsoDate({ value: '2026-03-01', label: 'x', dateOnlyAs: 'end' })?.iso).toBe('2026-03-01T23:59:59.999Z');
    expect(() => firefliesInput.strictIsoDate({ value: '2026-03-01T25:00:00Z', label: 'x', dateOnlyAs: 'start' })).toThrow('invalid time');
  });

  test('rejects invalid participant emails', () => {
    expect(() => searchMeetingsInternals.buildSearch({ ...EMPTY, participants: ['not-an-email'] })).toThrow('invalid email');
  });
});

describe('search_meetings paging', () => {
  test('a full page reports has_more and next_skip', async () => {
    stubFetch({ rows: 5 });
    const output = await searchMeetingsAction.run(fakeContext({ props: { limit: 5, skip: 10 } }));
    expect(output).toMatchObject({ count: 5, limit: 5, skip: 10, next_skip: 15, has_more: true });
  });

  test('a short page ends paging', async () => {
    const seen = stubFetch({ rows: 3 });
    const output = await searchMeetingsAction.run(fakeContext({ props: { limit: 5 } }));
    expect(output).toMatchObject({ count: 3, next_skip: null, has_more: false });
    expect(seen[0]).not.toContain('title:');
    expect(seen[0]).not.toContain('participant_email');
  });
});

function fakeContext({ props }: { props: Record<string, unknown> }): Parameters<typeof searchMeetingsAction.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: 'key' }, propsValue: props });
}

function stubFetch({ rows }: { rows: number }): string[] {
  const queries: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      queries.push(String(parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'query') : ''));
      const transcripts = Array.from({ length: rows }, (_, index) => ({ id: `m-${index}`, title: `Meeting ${index}` }));
      return new Response(JSON.stringify({ data: { transcripts } }), { status: 200 });
    }),
  );
  return queries;
}
