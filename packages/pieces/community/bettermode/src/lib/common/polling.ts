function newestCheckpoint<T extends PolledItem>({ items, fallback }: { items: T[]; fallback: string }): Checkpoint {
  const dated = items.filter((item) => parseTime(item.created_at) !== null);
  if (dated.length === 0) {
    return { lastCreatedAt: fallback, idsAtLast: [] };
  }
  const newest = dated.reduce((best, item) => (compareItems({ left: item, right: best }) > 0 ? item : best));
  const newestTime = parseTime(newest.created_at);
  return {
    lastCreatedAt: newest.created_at ?? fallback,
    idsAtLast: dated
      .filter((item) => parseTime(item.created_at) === newestTime && item.id !== null)
      .map((item) => item.id)
      .filter((id): id is string => id !== null)
      .slice(0, MAX_IDS_AT_LAST),
  };
}

async function collectNewItems<T extends PolledItem>({
  checkpoint,
  fetchPage,
}: {
  checkpoint: Checkpoint;
  fetchPage: (cursor: string | null) => Promise<PolledPage<T>>;
}): Promise<{ items: T[]; checkpoint: Checkpoint }> {
  const checkpointTime = parseTime(checkpoint.lastCreatedAt);
  if (checkpointTime === null) {
    throw new Error('The trigger checkpoint is invalid. Disable and re-enable the trigger.');
  }
  const seenAtLast = new Set(checkpoint.idsAtLast);
  const pages: T[][] = [];
  let cursor: string | null = null;
  for (let pageIndex = 0; pageIndex < MAX_POLL_PAGES; pageIndex++) {
    const page = await fetchPage(cursor);
    assertNewestFirst(page.items);
    pages.push(page.items);
    const reachedCheckpoint = page.items.some((item) => {
      const time = parseTime(item.created_at);
      return time !== null && time < checkpointTime;
    });
    if (reachedCheckpoint || !page.has_more || page.next_cursor === null) {
      break;
    }
    cursor = page.next_cursor;
  }
  const unique = new Map<string, T>();
  for (const item of pages.flat()) {
    if (item.id !== null && !unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }
  const fresh = [...unique.values()]
    .filter((item) => {
      const time = parseTime(item.created_at);
      if (time === null || item.id === null) {
        return false;
      }
      return time > checkpointTime || (time === checkpointTime && !seenAtLast.has(item.id));
    })
    .sort((left, right) => compareItems({ left, right }))
    .slice(0, MAX_EMIT_PER_POLL);
  if (fresh.length === 0) {
    return { items: [], checkpoint };
  }
  const next = newestCheckpoint({ items: fresh, fallback: checkpoint.lastCreatedAt });
  const sameTime = parseTime(next.lastCreatedAt) === checkpointTime;
  return {
    items: fresh,
    checkpoint: sameTime
      ? { lastCreatedAt: next.lastCreatedAt, idsAtLast: [...checkpoint.idsAtLast, ...next.idsAtLast].slice(-MAX_IDS_AT_LAST) }
      : next,
  };
}

function assertNewestFirst<T extends PolledItem>(items: T[]): void {
  const times = items.map((item) => parseTime(item.created_at)).filter((time): time is number => time !== null);
  const ascending = times.some((time, index) => index > 0 && time > times[index - 1]);
  if (ascending) {
    throw new Error('Bettermode returned items in an unexpected order (oldest first). The trigger cannot check for new items safely.');
  }
}

function compareItems({ left, right }: { left: PolledItem; right: PolledItem }): number {
  const leftTime = parseTime(left.created_at) ?? 0;
  const rightTime = parseTime(right.created_at) ?? 0;
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
};

export type PolledItem = {
  id: string | null;
  created_at: string | null;
};

export type PolledPage<T> = {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
};
