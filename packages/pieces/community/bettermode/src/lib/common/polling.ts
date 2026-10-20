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
  const isFresh = (item: PolledItem) => {
    const time = parseTime(timeOf(item));
    if (time === null || item.id === null) {
      return false;
    }
    return time > checkpointTime || (time === checkpointTime && !seenAtLast.has(item.id));
  };
  const isOlderThanCheckpoint = (item: PolledItem) => {
    const time = parseTime(timeOf(item));
    return time !== null && time < checkpointTime;
  };
  const stack = checkpoint.resumeCursors ?? [];
  const drainedCursor = checkpoint.drainedCursor ?? null;
  const windowStart = stack.length > 0 ? stack[stack.length - 1] : null;
  const parents = stack.slice(0, -1);
  const pages: T[][] = [];
  let cursor: string | null = windowStart;
  let complete = false;
  for (let pageIndex = 0; pageIndex <= MAX_POLL_PAGES; pageIndex++) {
    if (pageIndex > 0 && cursor !== null && cursor === drainedCursor) {
      complete = true;
      break;
    }
    const page = await fetchPage(cursor);
    assertNewestFirst({ items: page.items, timeField });
    pages.push(page.items);
    if (page.items.some(isOlderThanCheckpoint) || !page.has_more || page.next_cursor === null) {
      complete = true;
      break;
    }
    if (pageIndex < MAX_POLL_PAGES) {
      cursor = page.next_cursor;
    }
  }
  const base: Checkpoint = { lastCreatedAt: checkpoint.lastCreatedAt, idsAtLast: checkpoint.idsAtLast };
  if (!complete && cursor !== null) {
    return { items: [], checkpoint: withCursors({ checkpoint: base, cursors: [...stack, cursor], drainedCursor }) };
  }
  const unique = new Map<string, T>();
  for (const item of pages.flat()) {
    if (item.id !== null && !unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }
  const sorted = [...unique.values()].filter(isFresh).sort((left, right) => compareItems({ left, right, timeField }));
  const fresh = sorted.slice(0, MAX_EMIT_PER_POLL);
  const windowDrained = sorted.length <= MAX_EMIT_PER_POLL;
  const remaining = windowDrained ? parents : stack;
  const nextDrained = windowDrained ? windowStart : drainedCursor;
  if (fresh.length === 0) {
    return { items: [], checkpoint: withCursors({ checkpoint: base, cursors: parents, drainedCursor: windowStart }) };
  }
  const next = newestCheckpoint({ items: fresh, fallback: checkpoint.lastCreatedAt, timeField });
  const sameTime = parseTime(next.lastCreatedAt) === checkpointTime;
  const advanced: Checkpoint = sameTime
    ? { lastCreatedAt: next.lastCreatedAt, idsAtLast: [...checkpoint.idsAtLast, ...next.idsAtLast].slice(-MAX_IDS_AT_LAST) }
    : next;
  return { items: fresh, checkpoint: withCursors({ checkpoint: advanced, cursors: remaining, drainedCursor: nextDrained }) };
}

function withCursors({
  checkpoint,
  cursors,
  drainedCursor,
}: {
  checkpoint: Checkpoint;
  cursors: string[];
  drainedCursor: string | null;
}): Checkpoint {
  const withStack: Checkpoint = cursors.length > 0 ? { ...checkpoint, resumeCursors: cursors } : checkpoint;
  return drainedCursor !== null ? { ...withStack, drainedCursor } : withStack;
}

function checkpointChanged({ before, after }: { before: Checkpoint; after: Checkpoint }): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
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
const MAX_IDS_AT_LAST = 10000;

export const bettermodePolling = {
  newestCheckpoint,
  collectNewItems,
  checkpointChanged,
  CHECKPOINT_KEY: 'bettermode_checkpoint',
  POLL_PAGE_SIZE: 50,
};

export type Checkpoint = {
  lastCreatedAt: string;
  idsAtLast: string[];
  resumeCursors?: string[];
  drainedCursor?: string;
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
