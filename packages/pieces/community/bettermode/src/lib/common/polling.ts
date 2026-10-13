function newestCheckpoint<T extends PolledItem>({
  items,
  fallback,
  timeField = 'created_at',
}: {
  items: T[];
  fallback: string;
  timeField?: TimeField;
}): Checkpoint {
  const timeOf = (item: PolledItem) => item[timeField] ?? null;
  const dated = items.filter((item) => parseTime(timeOf(item)) !== null);
  if (dated.length === 0) {
    return { lastCreatedAt: fallback, idsAtLast: [] };
  }
  const newest = dated.reduce((best, item) => (compareItems({ left: item, right: best, timeField }) > 0 ? item : best));
  const newestTime = parseTime(timeOf(newest));
  return {
    lastCreatedAt: timeOf(newest) ?? fallback,
    idsAtLast: dated
      .filter((item) => parseTime(timeOf(item)) === newestTime && item.id !== null)
      .map((item) => item.id)
      .filter((id): id is string => id !== null)
      .slice(0, MAX_IDS_AT_LAST),
  };
}

async function collectNewItems<T extends PolledItem>({
  checkpoint,
  fetchPage,
  timeField = 'created_at',
}: {
  checkpoint: Checkpoint;
  fetchPage: (cursor: string | null) => Promise<PolledPage<T>>;
  timeField?: TimeField;
}): Promise<{ items: T[]; checkpoint: Checkpoint }> {
  const timeOf = (item: PolledItem) => item[timeField] ?? null;
  const checkpointTime = parseTime(checkpoint.lastCreatedAt);
  if (checkpointTime === null) {
    throw new Error('The trigger checkpoint is invalid. Disable and re-enable the trigger.');
  }
  const seenAtLast = new Set(checkpoint.idsAtLast);
  const base: Checkpoint = { lastCreatedAt: checkpoint.lastCreatedAt, idsAtLast: checkpoint.idsAtLast };
  const pages: T[][] = [];
  let cursor: string | null = checkpoint.resumeCursor ?? null;
  let complete = false;
  for (let pageIndex = 0; pageIndex < MAX_POLL_PAGES; pageIndex++) {
    const page = await fetchPage(cursor);
    assertNewestFirst({ items: page.items, timeField });
    pages.push(page.items);
    const reachedCheckpoint = page.items.some((item) => {
      const time = parseTime(timeOf(item));
      return time !== null && time < checkpointTime;
    });
    if (reachedCheckpoint || !page.has_more || page.next_cursor === null) {
      complete = true;
      break;
    }
    cursor = page.next_cursor;
  }
  if (!complete && cursor !== null) {
    return { items: [], checkpoint: { ...base, resumeCursor: cursor } };
  }
  const unique = new Map<string, T>();
  for (const item of pages.flat()) {
    if (item.id !== null && !unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }
  const fresh = [...unique.values()]
    .filter((item) => {
      const time = parseTime(timeOf(item));
      if (time === null || item.id === null) {
        return false;
      }
      return time > checkpointTime || (time === checkpointTime && !seenAtLast.has(item.id));
    })
    .sort((left, right) => compareItems({ left, right, timeField }))
    .slice(0, MAX_EMIT_PER_POLL);
  if (fresh.length === 0) {
    return { items: [], checkpoint: base };
  }
  const next = newestCheckpoint({ items: fresh, fallback: checkpoint.lastCreatedAt, timeField });
  const sameTime = parseTime(next.lastCreatedAt) === checkpointTime;
  return {
    items: fresh,
    checkpoint: sameTime
      ? { lastCreatedAt: next.lastCreatedAt, idsAtLast: [...checkpoint.idsAtLast, ...next.idsAtLast].slice(-MAX_IDS_AT_LAST) }
      : next,
  };
}

function assertNewestFirst<T extends PolledItem>({ items, timeField }: { items: T[]; timeField: TimeField }): void {
  const times = items.map((item) => parseTime(item[timeField] ?? null)).filter((time): time is number => time !== null);
  const ascending = times.some((time, index) => index > 0 && time > times[index - 1]);
  if (ascending) {
    throw new Error('Bettermode returned items in an unexpected order (oldest first). The trigger cannot check for new items safely.');
  }
}

function compareItems({ left, right, timeField }: { left: PolledItem; right: PolledItem; timeField: TimeField }): number {
  const leftTime = parseTime(left[timeField] ?? null) ?? 0;
  const rightTime = parseTime(right[timeField] ?? null) ?? 0;
  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return (left.id ?? '').localeCompare(right.id ?? '');
}

function parseTime(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

const MAX_POLL_PAGES = 10;
const MAX_EMIT_PER_POLL = 100;
const MAX_IDS_AT_LAST = 200;

export const bettermodePolling = {
  newestCheckpoint,
  collectNewItems,
  CHECKPOINT_KEY: 'bettermode_checkpoint',
  POLL_PAGE_SIZE: 50,
};

export type Checkpoint = {
  lastCreatedAt: string;
  idsAtLast: string[];
  resumeCursor?: string | null;
};

type TimeField = 'created_at' | 'published_at';

export type PolledItem = {
  id: string | null;
  created_at: string | null;
  published_at?: string | null;
};

export type PolledPage<T> = {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
};
