import { describe, expect, it } from 'vitest';
import { twentyTimelineUtils } from '../src/lib/common/timeline';
import type {
  TwentyRecord,
  TwentyTimelineActivity,
  TwentyTimelineDiff,
} from '../src/lib/common/types';

const { toTimelineActivity, isTimelineDiff, findNewChanges, nextDiffCache, groupChangesByRecord } =
  twentyTimelineUtils;

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function makeActivity({
  id = 'a1',
  recordId = 'p1',
  diff,
  workspaceMemberId = 'm1',
  updatedAt = '2026-01-01T10:00:00.000Z',
  createdAt = '2026-01-01T10:00:00.000Z',
}: {
  id?: string;
  recordId?: string;
  diff: TwentyTimelineDiff;
  workspaceMemberId?: string | null;
  updatedAt?: string;
  createdAt?: string;
}): TwentyTimelineActivity {
  return { id, recordId, diff, workspaceMemberId, updatedAt, createdAt };
}

describe('toTimelineActivity', () => {
  const validRow: TwentyRecord = {
    id: 't1',
    targetPersonId: 'p1',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:05:00.000Z',
    workspaceMemberId: 'm1',
    properties: { diff: { jobTitle: { before: 'A', after: 'B' } } },
  };

  it('maps a valid row to an activity of the target record', () => {
    expect(toTimelineActivity({ record: validRow, targetColumn: 'targetPersonId' })).toEqual({
      id: 't1',
      recordId: 'p1',
      workspaceMemberId: 'm1',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-01T10:05:00.000Z',
      diff: { jobTitle: { before: 'A', after: 'B' } },
    });
  });

  it('uses null when the row has no workspace member', () => {
    const activity = toTimelineActivity({
      record: { ...validRow, workspaceMemberId: undefined },
      targetColumn: 'targetPersonId',
    });

    expect(activity?.workspaceMemberId).toBeNull();
  });

  it.each<[string, TwentyRecord]>([
    ['the id is missing', { ...validRow, id: undefined }],
    ['the target column is missing', { ...validRow, targetPersonId: undefined }],
    ['updatedAt is missing', { ...validRow, updatedAt: undefined }],
    ['createdAt is missing', { ...validRow, createdAt: undefined }],
    ['properties is not an object', { ...validRow, properties: 'diff' }],
    ['properties has no diff', { ...validRow, properties: {} }],
    ['a diff entry has no after', { ...validRow, properties: { diff: { jobTitle: { before: 'A' } } } }],
    ['the diff is empty', { ...validRow, properties: { diff: {} } }],
  ])('skips the row when %s', (_, record) => {
    expect(toTimelineActivity({ record, targetColumn: 'targetPersonId' })).toBeUndefined();
  });
});

describe('isTimelineDiff', () => {
  it('accepts entries that each have before and after', () => {
    expect(isTimelineDiff({ a: { before: 1, after: 2 }, b: { before: null, after: 'x' } })).toBe(true);
  });

  it.each<[string, unknown]>([
    ['null', null],
    ['a string', 'diff'],
    ['an entry without before', { a: { after: 2 } }],
    ['an entry that is null', { a: null }],
  ])('rejects %s', (_, diff) => {
    expect(isTimelineDiff(diff)).toBe(false);
  });
});

describe('findNewChanges', () => {
  it('reports every change of an activity it has not seen', () => {
    const activity = makeActivity({ diff: { jobTitle: { before: 'A', after: 'B' } } });

    expect(findNewChanges({ activities: [activity], cache: {} })).toEqual([
      { activity, changes: { jobTitle: { before: 'A', after: 'B' } } },
    ]);
  });

  it('skips an activity whose values were already reported', () => {
    const activity = makeActivity({ diff: { jobTitle: { before: 'A', after: 'B' } } });
    const cache = { a1: { values: { jobTitle: 'B' }, createdAt: 0 } };

    expect(findNewChanges({ activities: [activity], cache })).toEqual([]);
  });

  it('reports a changed value of a seen activity from the value reported last', () => {
    const activity = makeActivity({ diff: { jobTitle: { before: 'A', after: 'C' } } });
    const cache = { a1: { values: { jobTitle: 'B' }, createdAt: 0 } };

    expect(findNewChanges({ activities: [activity], cache })).toEqual([
      { activity, changes: { jobTitle: { before: 'B', after: 'C' } } },
    ]);
  });

  it('reports only the fields that are new on a seen activity', () => {
    const activity = makeActivity({
      diff: {
        jobTitle: { before: 'A', after: 'B' },
        city: { before: 'Paris', after: 'Rome' },
      },
    });
    const cache = { a1: { values: { jobTitle: 'B' }, createdAt: 0 } };

    expect(findNewChanges({ activities: [activity], cache })).toEqual([
      { activity, changes: { city: { before: 'Paris', after: 'Rome' } } },
    ]);
  });

  it('compares object values by content, not by reference', () => {
    const activity = makeActivity({
      diff: { name: { before: null, after: { firstName: 'Ada' } } },
    });
    const cache = { a1: { values: { name: { firstName: 'Ada' } }, createdAt: 0 } };

    expect(findNewChanges({ activities: [activity], cache })).toEqual([]);
  });
});

describe('nextDiffCache', () => {
  const now = Date.parse('2026-01-01T12:00:00.000Z');

  it('forgets entries older than fifteen minutes and keeps the rest', () => {
    const cache = {
      expired: { values: {}, createdAt: now - FIFTEEN_MINUTES - 1 },
      boundary: { values: {}, createdAt: now - FIFTEEN_MINUTES },
      fresh: { values: { city: 'Rome' }, createdAt: now - 1000 },
    };

    expect(nextDiffCache({ cache, changed: [], now })).toEqual({
      boundary: cache.boundary,
      fresh: cache.fresh,
    });
  });

  it('stores the new after values on top of what was cached for the activity', () => {
    const activity = makeActivity({
      createdAt: '2026-01-01T11:59:00.000Z',
      diff: { jobTitle: { before: 'A', after: 'B' } },
    });
    const cache = { a1: { values: { city: 'Rome' }, createdAt: now - 1000 } };

    const result = nextDiffCache({
      cache,
      changed: [{ activity, changes: { jobTitle: { before: 'A', after: 'B' } } }],
      now,
    });

    expect(result).toEqual({
      a1: {
        values: { city: 'Rome', jobTitle: 'B' },
        createdAt: Date.parse('2026-01-01T11:59:00.000Z'),
      },
    });
  });
});

describe('groupChangesByRecord', () => {
  it('merges changes to one record into a single event from first before to last after', () => {
    const first = makeActivity({
      id: 'a1',
      diff: { jobTitle: { before: 'A', after: 'B' } },
      updatedAt: '2026-01-01T10:00:00.000Z',
    });
    const second = makeActivity({
      id: 'a2',
      diff: {
        jobTitle: { before: 'B', after: 'C' },
        city: { before: 'Paris', after: 'Rome' },
      },
      updatedAt: '2026-01-01T10:05:00.000Z',
    });

    const grouped = groupChangesByRecord({
      changed: [
        { activity: first, changes: first.diff },
        { activity: second, changes: second.diff },
      ],
    });

    expect([...grouped]).toEqual([
      [
        'p1',
        {
          changes: {
            jobTitle: { before: 'A', after: 'C' },
            city: { before: 'Paris', after: 'Rome' },
          },
          workspaceMemberIds: ['m1'],
          updatedAt: '2026-01-01T10:05:00.000Z',
        },
      ],
    ]);
  });

  it('lists each workspace member once, including an unknown one', () => {
    const activities = [
      makeActivity({ id: 'a1', workspaceMemberId: 'm1', diff: { x: { before: 1, after: 2 } } }),
      makeActivity({ id: 'a2', workspaceMemberId: null, diff: { x: { before: 2, after: 3 } } }),
      makeActivity({ id: 'a3', workspaceMemberId: 'm1', diff: { x: { before: 3, after: 4 } } }),
    ];

    const grouped = groupChangesByRecord({
      changed: activities.map((activity) => ({ activity, changes: activity.diff })),
    });

    expect(grouped.get('p1')?.workspaceMemberIds).toEqual(['m1', null]);
  });

  it('keeps changes to different records apart', () => {
    const activities = [
      makeActivity({ id: 'a1', recordId: 'p1', diff: { x: { before: 1, after: 2 } } }),
      makeActivity({ id: 'a2', recordId: 'p2', diff: { x: { before: 5, after: 6 } } }),
    ];

    const grouped = groupChangesByRecord({
      changed: activities.map((activity) => ({ activity, changes: activity.diff })),
    });

    expect([...grouped.keys()]).toEqual(['p1', 'p2']);
    expect(grouped.get('p2')?.changes).toEqual({ x: { before: 5, after: 6 } });
  });
});
