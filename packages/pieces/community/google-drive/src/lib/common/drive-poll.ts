import { Store } from '@activepieces/pieces-framework';
import { drive_v3 } from '@googleapis/drive';
import {
  DriveListing,
  ListingPosition,
  PassEntry,
  ResumableParams,
} from './index';

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
  const recent: DriveRecent = { cursor, from: cursor + 1, seen: [] };
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
    'cursor' in value &&
    typeof value.cursor === 'number' &&
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
    return { cursor, from, seen: inWindow };
  }
  const narrowedFrom = Math.max(from, cursor);
  console.warn(
    `Google Drive: ${inWindow.length} items changed in the last few minutes; late-index re-checks are paused until the next quiet check.`
  );
  return {
    cursor,
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
  if (listing.truncated && listing.holdCursor) {
    return cursor;
  }
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
  const holdCursor = listings.some(
    (listing) => listing.truncated && listing.holdCursor === true
  );
  return watermarks.length > 0
    ? {
        files,
        truncated: true,
        watermark: watermarks.reduce(
          (lowest, watermark) => Math.min(lowest, watermark),
          Number.POSITIVE_INFINITY
        ),
        holdCursor,
      }
    : { files, truncated: false };
}

function safePosition({
  listing,
  isDelivered,
  cursorHeld,
}: {
  listing: DriveListing;
  isDelivered: (file: drive_v3.Schema$File) => boolean;
  cursorHeld: boolean;
}): ListingPosition | null {
  if (!listing.truncated || !listing.position) {
    return null;
  }
  if (
    'pending' in listing.position &&
    listing.position.pending.length === 0 &&
    !cursorHeld
  ) {
    return null;
  }
  return listing.files.every(isDelivered) ? listing.position : null;
}

function optionalOf<T>({
  source,
  key,
  guard,
}: {
  source: object;
  key: string;
  guard: (value: unknown) => value is T;
}): Optional<T> {
  const value: unknown = Reflect.get(source, key);
  if (value === undefined) {
    return { valid: true, value: undefined };
  }
  return guard(value) ? { valid: true, value } : { valid: false };
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function readParams(value: unknown): ResumableParams | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const text = (key: string) => optionalOf({ source: value, key, guard: isString });
  const q = text('q');
  const orderBy = text('orderBy');
  const corpora = text('corpora');
  const driveId = text('driveId');
  const fields = text('fields');
  const pageSize = optionalOf({ source: value, key: 'pageSize', guard: isNumber });
  const supportsAllDrives = optionalOf({
    source: value,
    key: 'supportsAllDrives',
    guard: isBoolean,
  });
  const includeItemsFromAllDrives = optionalOf({
    source: value,
    key: 'includeItemsFromAllDrives',
    guard: isBoolean,
  });
  if (
    !q.valid ||
    !orderBy.valid ||
    !corpora.valid ||
    !driveId.valid ||
    !fields.valid ||
    !pageSize.valid ||
    !supportsAllDrives.valid ||
    !includeItemsFromAllDrives.valid
  ) {
    return undefined;
  }
  return {
    q: q.value,
    orderBy: orderBy.value,
    corpora: corpora.value,
    driveId: driveId.value,
    fields: fields.value,
    pageSize: pageSize.value,
    supportsAllDrives: supportsAllDrives.value,
    includeItemsFromAllDrives: includeItemsFromAllDrives.value,
  };
}

function readPassEntry(value: unknown): PassEntry | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const pageToken: unknown = Reflect.get(value, 'pageToken');
  const params = readParams(Reflect.get(value, 'params'));
  if (!params || (pageToken !== undefined && typeof pageToken !== 'string')) {
    return null;
  }
  return pageToken === undefined ? { params } : { params, pageToken };
}

function readDrivePass(value: object): ListingPosition | null {
  const startedAt: unknown = Reflect.get(value, 'startedAt');
  const pending: unknown = Reflect.get(value, 'pending');
  if (typeof startedAt !== 'number' || !Array.isArray(pending)) {
    return null;
  }
  const entries = pending.map(readPassEntry);
  return entries.every((entry): entry is PassEntry => entry !== null)
    ? { startedAt, pending: entries }
    : null;
}

function readPosition(value: unknown): ListingPosition | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  if ('pending' in value) {
    return readDrivePass(value);
  }
  const pageToken: unknown = Reflect.get(value, 'pageToken');
  const params = readParams(Reflect.get(value, 'params'));
  return typeof pageToken === 'string' && params ? { params, pageToken } : null;
}

function readResume(value: unknown): DriveResume | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const cursor: unknown = Reflect.get(value, 'cursor');
  const positions: unknown = Reflect.get(value, 'positions');
  if (typeof cursor !== 'number' || !Array.isArray(positions)) {
    return undefined;
  }
  return { cursor, positions: positions.map(readPosition) };
}

async function poll({
  store,
  maxItems,
  list,
  describe,
}: {
  store: Store;
  maxItems: number;
  list: (window: {
    from: number;
    maxFiles: number;
    positions: (ListingPosition | undefined)[];
  }) => Promise<DriveListing[]>;
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
  const recent =
    isDriveRecent(stored) && stored.cursor === cursor ? stored : undefined;
  const from = recent ? Math.min(recent.from, cursor + 1) : cursor + 1;
  const seen = (recent?.seen ?? []).filter((entry) => entry.epoch >= from);
  const seenKeys = new Set(seen.map(seenKey));
  const firedIds = new Set(seen.map((entry) => entry.id));

  const saved = readResume(await store.get<unknown>(RESUME_KEY));
  const positions =
    saved && saved.cursor === cursor
      ? saved.positions.map((position) => position ?? undefined)
      : [];
  const listings = await list({
    from,
    maxFiles: maxItems + seen.length,
    positions,
  });
  const listing = combineListings(listings);
  const now = Date.now();

  const entries = listing.files
    .map((file) => describe({ file, from, firedIds }))
    .filter((entry): entry is PollEntry => entry !== undefined)
    .filter(
      (entry) =>
        Number.isFinite(entry.epoch) &&
        entry.epoch >= from &&
        entry.epoch <= now &&
        (!listing.truncated ||
          listing.holdCursor === true ||
          entry.epoch <= listing.watermark)
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

  const delivered = new Set([...seenKeys, ...emitted.map(seenKey)]);
  const resumeAfter: DriveResume = {
    cursor: cursorAfter,
    positions: listings.map((streamListing) =>
      safePosition({
        listing: streamListing,
        cursorHeld: listing.truncated && listing.holdCursor === true,
        isDelivered: (file) => {
          const entry = describe({ file, from, firedIds });
          return (
            entry === undefined ||
            (Number.isFinite(entry.epoch) && entry.epoch < from) ||
            delivered.has(seenKey(entry))
          );
        },
      })
    ),
  };

  await store.put(CURSOR_KEY, cursorAfter);
  await store.put(RECENT_KEY, recentAfter);
  await store.put(RESUME_KEY, resumeAfter);
  return emitted.map((entry) => entry.data);
}

const CURSOR_KEY = 'lastPoll';
const RECENT_KEY = 'driveRecent';
const RESUME_KEY = 'driveResume';
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

type DriveRecent = { cursor: number; from: number; seen: SeenEntry[] };

type Optional<T> = { valid: true; value: T | undefined } | { valid: false };

type DriveResume = { cursor: number; positions: (ListingPosition | null)[] };

export type PollEntry = {
  id: string;
  epoch: number;
  data: unknown;
};
