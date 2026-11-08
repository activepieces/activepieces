import { Store } from '@activepieces/pieces-framework';
import { drive_v3 } from '@googleapis/drive';
import { DriveListing } from './index';

async function onEnable({
  store,
  isRepublish,
}: {
  store: Store;
  isRepublish: boolean | undefined;
}): Promise<void> {
  if (isRepublish) {
    return;
  }
  const cursor = await store.get<number>(CURSOR_KEY);
  if (typeof cursor !== 'number') {
    return;
  }
  const recent: DriveRecent = { from: cursor + 1, seen: [] };
  await store.put(RECENT_KEY, recent);
}

function maxItemsPerPoll({
  includeFileContent,
}: {
  includeFileContent: boolean | undefined;
}): number {
  return includeFileContent ? MAX_ITEMS_WITH_CONTENT : MAX_ITEMS_PER_POLL;
}

function epochOf(value: string | null | undefined): number {
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

function byCreatedTime(file: drive_v3.Schema$File): PollEntry | undefined {
  if (!file.id) {
    return undefined;
  }
  return { id: file.id, epoch: epochOf(file.createdTime), data: file };
}

function isSeenEntry(value: unknown): value is SeenEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'epoch' in value &&
    typeof value.epoch === 'number'
  );
}

function isDriveRecent(value: unknown): value is DriveRecent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'from' in value &&
    typeof value.from === 'number' &&
    'seen' in value &&
    Array.isArray(value.seen) &&
    value.seen.every(isSeenEntry)
  );
}

function seenKey(entry: SeenEntry): string {
  return `${entry.id}@${entry.epoch}`;
}

function uniqueSeen(entries: SeenEntry[]): SeenEntry[] {
  const byKey = new Map<string, SeenEntry>();
  for (const entry of entries) {
    byKey.set(seenKey(entry), { id: entry.id, epoch: entry.epoch });
  }
  return [...byKey.values()];
}

function boundSeen({
  seen,
  from,
  cursor,
}: {
  seen: SeenEntry[];
  from: number;
  cursor: number;
}): DriveRecent {
  const inWindow = seen.filter((entry) => entry.epoch >= from);
  if (inWindow.length <= MAX_SEEN) {
    return { from, seen: inWindow };
  }
  const narrowedFrom = Math.max(from, cursor);
  console.warn(
    `Google Drive: ${inWindow.length} items changed in the last few minutes; late-index re-checks are paused until the next quiet check.`
  );
  return {
    from: narrowedFrom,
    seen: seen.filter((entry) => entry.epoch >= narrowedFrom),
  };
}

function nextCursor({
  cursor,
  listing,
  entries,
  emitted,
  capped,
  now,
}: {
  cursor: number;
  listing: DriveListing;
  entries: PollEntry[];
  emitted: PollEntry[];
  capped: boolean;
  now: number;
}): number {
  const lastEmitted = emitted[emitted.length - 1];
  if (capped && lastEmitted) {
    return Math.max(cursor, lastEmitted.epoch);
  }
  if (listing.truncated) {
    return Math.max(cursor, Math.min(listing.watermark, now));
  }
  return entries.reduce((max, entry) => Math.max(max, entry.epoch), cursor);
}

function combineListings(listings: DriveListing[]): DriveListing {
  const byId = new Map<string, drive_v3.Schema$File>();
  for (const file of listings.flatMap((listing) => listing.files)) {
    if (file.id && !byId.has(file.id)) byId.set(file.id, file);
  }
  const files = [...byId.values()];
  const watermarks = listings.flatMap((listing) =>
    listing.truncated ? [listing.watermark] : []
  );
  return watermarks.length > 0
    ? {
        files,
        truncated: true,
        watermark: watermarks.reduce(
          (lowest, watermark) => Math.min(lowest, watermark),
          Number.POSITIVE_INFINITY
        ),
      }
    : { files, truncated: false };
}

async function poll({
  store,
  maxItems,
  list,
  describe,
}: {
  store: Store;
  maxItems: number;
  list: (window: { from: number; maxFiles: number }) => Promise<DriveListing>;
  describe: (args: {
    file: drive_v3.Schema$File;
    from: number;
    firedIds: Set<string>;
  }) => PollEntry | undefined;
}): Promise<unknown[]> {
  const cursor = await store.get<number>(CURSOR_KEY);
  if (typeof cursor !== 'number') {
    throw new Error("lastPoll doesn't exist in the store.");
  }
  const stored = await store.get<unknown>(RECENT_KEY);
  const recent = isDriveRecent(stored) ? stored : undefined;
  const from = recent ? Math.min(recent.from, cursor + 1) : cursor + 1;
  const seen = (recent?.seen ?? []).filter((entry) => entry.epoch >= from);
  const seenKeys = new Set(seen.map(seenKey));
  const firedIds = new Set(seen.map((entry) => entry.id));

  const listing = await list({ from, maxFiles: maxItems + seen.length });
  const now = Date.now();

  const entries = listing.files
    .map((file) => describe({ file, from, firedIds }))
    .filter((entry): entry is PollEntry => entry !== undefined)
    .filter(
      (entry) =>
        Number.isFinite(entry.epoch) &&
        entry.epoch >= from &&
        entry.epoch <= now &&
        (!listing.truncated || entry.epoch <= listing.watermark)
    );
  const fresh = entries
    .filter((entry) => !seenKeys.has(seenKey(entry)))
    .sort((a, b) => a.epoch - b.epoch || a.id.localeCompare(b.id));
  const emitted = fresh.slice(0, maxItems);
  const capped = fresh.length > maxItems;

  const cursorAfter = nextCursor({
    cursor,
    listing,
    entries,
    emitted,
    capped,
    now,
  });
  const draining = capped || listing.truncated;
  const fromAfter = Math.max(
    from,
    draining ? cursorAfter : cursorAfter - LATE_INDEX_WINDOW_MS
  );
  const recentAfter = boundSeen({
    seen: uniqueSeen([...seen, ...emitted]),
    from: fromAfter,
    cursor: cursorAfter,
  });

  if (capped) {
    console.warn(
      `Google Drive: ${fresh.length} new items found; sent the oldest ${maxItems}. The rest come in the next checks.`
    );
  } else if (listing.truncated) {
    console.warn(
      'Google Drive: listing stopped at the time limit; the rest come in the next checks.'
    );
  }

  await store.put(CURSOR_KEY, cursorAfter);
  await store.put(RECENT_KEY, recentAfter);
  return emitted.map((entry) => entry.data);
}

const CURSOR_KEY = 'lastPoll';
const RECENT_KEY = 'driveRecent';
const MAX_ITEMS_PER_POLL = 500;
const MAX_ITEMS_WITH_CONTENT = 50;
const LATE_INDEX_WINDOW_MS = 5 * 60_000;
const MAX_SEEN = 2000;

export const drivePoll = {
  onEnable,
  poll,
  maxItemsPerPoll,
  byCreatedTime,
  combineListings,
};

type SeenEntry = { id: string; epoch: number };

type DriveRecent = { from: number; seen: SeenEntry[] };

export type PollEntry = {
  id: string;
  epoch: number;
  data: unknown;
};
