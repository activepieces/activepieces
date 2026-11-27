import dayjs from 'dayjs';

import type {
  TwentyDiffCache,
  TwentyRecord,
  TwentyTimelineActivity,
  TwentyTimelineDiff,
} from './types';

const CACHE_LIFETIME = 15 * 60 * 1000;

function toTimelineActivity({
  record,
  targetColumn,
}: {
  record: TwentyRecord;
  targetColumn: string;
}): TwentyTimelineActivity | undefined {
  const recordId = record[targetColumn];
  const properties = record['properties'];

  if (
    typeof record.id !== 'string' ||
    typeof recordId !== 'string' ||
    typeof record.updatedAt !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof properties !== 'object' ||
    properties === null ||
    !('diff' in properties) ||
    !isTimelineDiff(properties.diff) ||
    Object.keys(properties.diff).length === 0
  )
    return undefined;

  const workspaceMemberId = record['workspaceMemberId'];
  return {
    id: record.id,
    recordId,
    workspaceMemberId:
      typeof workspaceMemberId === 'string' ? workspaceMemberId : null,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    diff: properties.diff,
  };
}

function isTimelineDiff(diff: unknown): diff is TwentyTimelineDiff {
  return (
    typeof diff === 'object' &&
    diff !== null &&
    Object.values(diff).every(
      (change) =>
        typeof change === 'object' &&
        change !== null &&
        'before' in change &&
        'after' in change
    )
  );
}

function findNewChanges({
  activities,
  cache,
}: {
  activities: TwentyTimelineActivity[];
  cache: TwentyDiffCache;
}): ActivityChanges[] {
  return activities.flatMap((activity) => {
    const cachedActivity = cache[activity.id];

    const changes = Object.fromEntries(
      Object.entries(activity.diff).flatMap(([key, change]) => {
        const isCached =
          cachedActivity !== undefined && key in cachedActivity.values;
        if (
          isCached &&
          JSON.stringify(cachedActivity.values[key]) ===
            JSON.stringify(change.after)
        )
          return [];

        const before = isCached ? cachedActivity.values[key] : change.before;
        return [[key, { before, after: change.after }]];
      })
    );

    if (Object.keys(changes).length === 0) return [];
    return [{ activity, changes }];
  });
}

function nextDiffCache({
  cache,
  changed,
  now,
}: {
  cache: TwentyDiffCache;
  changed: ActivityChanges[];
  now: number;
}): TwentyDiffCache {
  return {
    ...Object.fromEntries(
      Object.entries(cache).filter(
        ([, entry]) => now - entry.createdAt <= CACHE_LIFETIME
      )
    ),
    ...Object.fromEntries(
      changed.map(({ activity, changes }) => [
        activity.id,
        {
          values: {
            ...cache[activity.id]?.values,
            ...Object.fromEntries(
              Object.entries(changes).map(([key, diff]) => [key, diff.after])
            ),
          },
          createdAt: dayjs(activity.createdAt).valueOf(),
        },
      ])
    ),
  };
}

function groupChangesByRecord({
  changed,
}: {
  changed: ActivityChanges[];
}): Map<string, RecordChanges> {
  const grouped = new Map<string, RecordChanges>();
  for (const { activity, changes } of changed) {
    const found = grouped.get(activity.recordId);

    const mergedChanges = Object.fromEntries(
      Object.entries(changes).map(([key, diff]) => {
        const earlier = found?.changes[key];

        return [
          key,
          {
            before: earlier !== undefined ? earlier.before : diff.before,
            after: diff.after,
          },
        ];
      })
    );
    grouped.set(activity.recordId, {
      changes: { ...found?.changes, ...mergedChanges },
      workspaceMemberIds: [
        ...new Set([
          ...(found?.workspaceMemberIds ?? []),
          activity.workspaceMemberId,
        ]),
      ],
      updatedAt: activity.updatedAt,
    });
  }
  return grouped;
}

export const twentyTimelineUtils = {
  toTimelineActivity,
  isTimelineDiff,
  findNewChanges,
  nextDiffCache,
  groupChangesByRecord,
};

export type RecordChanges = {
  changes: TwentyTimelineDiff;
  workspaceMemberIds: (string | null)[];
  updatedAt: string;
};

export type ActivityChanges = {
  activity: TwentyTimelineActivity;
  changes: TwentyTimelineDiff;
};
