import { isNil, Store, tryCatch } from '@activepieces/pieces-framework';
import { GoogleCalendarAuthValue } from '.';
import { eventScan } from './event-scan';
import { rangeEvents, RangeListing } from './range-events';
import { GoogleCalendarEvent } from './types';

const LEGACY_LAST_POLL_STORE_KEY = 'lastPoll';
const LISTING_BUDGET_MS = 25_000;
const VISIBILITY_MARGIN_MS = 60_000;
const ALL_DAY_SLACK_MS = 14 * 60 * 60 * 1000;
const LOOKBACK_CAP_MS = 7 * 24 * 60 * 60 * 1000;
const SEEN_LIMIT = 1000;
const PREVIOUS_VERSION_WINDOW_MS = 5 * 60 * 1000;
const REJECTED_TOKEN_STATUSES = [400, 404, 410];

async function enable({
  store,
  storeKey,
  watchKey,
  isRepublish,
  legacyResume,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
  isRepublish: boolean;
  legacyResume: LegacyResume;
}): Promise<void> {
  if (isRepublish) {
    const existing = await readCheckpoint({
      store,
      storeKey,
      watchKey,
      legacyResume,
    });
    if (!isNil(existing)) {
      await store.put<DueCheckpoint>(storeKey, existing);
      return;
    }
  }
  await saveBaseline({ store, storeKey, watchKey });
}

async function poll({
  auth,
  store,
  storeKey,
  watchKey,
  calendarId,
  eventId,
  leadMs,
  anchor,
  legacyResume,
  logPrefix,
}: {
  auth: GoogleCalendarAuthValue;
  store: Store;
  storeKey: string;
  watchKey: string;
  calendarId: string;
  eventId: string | undefined;
  leadMs: number;
  anchor: 'start' | 'end';
  legacyResume: LegacyResume;
  logPrefix: string;
}): Promise<GoogleCalendarEvent[]> {
  const nowMs = Date.now();
  const checkpoint = await readCheckpoint({
    store,
    storeKey,
    watchKey,
    legacyResume,
  });
  if (isNil(checkpoint)) {
    await saveBaseline({ store, storeKey, watchKey });
    return [];
  }
  const pass =
    checkpoint.pass ?? startPass({ checkpoint, nowMs, leadMs, logPrefix });
  const fromMs = Math.max(pass.fromMs, checkpoint.floorMs);
  const throughMs = pass.throughMs;
  const handled = checkpoint.handled;
  const listing = isNil(eventId)
    ? await listPass({ auth, calendarId, pass, nowMs, logPrefix })
    : await listPinnedEvent({ auth, calendarId, eventId });
  const seenKeys = new Set(checkpoint.seen.map((entry) => entry.key));
  const legacy = checkpoint.legacy;
  const due = listing.events
    .filter((event) => event.status !== 'cancelled' && !isNil(event.id))
    .map((event) =>
      toDueEntry({ event, anchor, leadMs, timeZone: listing.timeZone })
    )
    .filter(
      (entry): entry is DueEntry =>
        !isNil(entry) &&
        entry.dueMs > fromMs &&
        entry.dueMs <= throughMs &&
        !startedBeforeReminder({ entry, anchor, nowMs }) &&
        !seenKeys.has(entry.key) &&
        !isCoveredBy({ entry, handled }) &&
        (isNil(legacy) ||
          !firedByPreviousVersion({ entry, anchor, leadMs, legacy }))
    )
    .sort((left, right) => left.dueMs - right.dueMs);
  const dueThroughMs = listing.complete
    ? Math.max(checkpoint.dueThroughMs, throughMs)
    : checkpoint.dueThroughMs;
  const floorMs =
    listing.complete && !isNil(handled)
      ? Math.max(checkpoint.floorMs, handled.dueMs)
      : checkpoint.floorMs;
  const nextPass =
    listing.complete || isNil(listing.nextPageToken)
      ? {}
      : { pass: { ...pass, pageToken: listing.nextPageToken } };
  await store.put<DueCheckpoint>(
    storeKey,
    limitSeen({
      checkpoint: {
        watchKey,
        dueThroughMs,
        floorMs,
        ...keepLegacy({ legacy, dueThroughMs }),
        ...nextPass,
        ...(listing.complete || isNil(handled) ? {} : { handled }),
        seen: [
          ...checkpoint.seen,
          ...due.map((entry) => ({
            key: entry.key,
            untilMs: entry.dueMs,
            startMs: entry.startMs,
          })),
        ],
      },
      listedThroughStartMs: listing.complete
        ? null
        : lastListedStartMs({ listing }),
      logPrefix,
    })
  );
  return due.map((entry) => entry.event);
}

async function listPinnedEvent({
  auth,
  calendarId,
  eventId,
}: {
  auth: GoogleCalendarAuthValue;
  calendarId: string;
  eventId: string;
}): Promise<RangeListing> {
  const event = await rangeEvents.getEventOrNull({
    auth,
    calendarId,
    eventId,
  });
  if (isNil(event) || event.status === 'cancelled') {
    return { events: [], timeZone: undefined, complete: true };
  }
  const timeZone = rangeEvents.isAllDay({ event })
    ? await rangeEvents.getCalendarTimeZone({ auth, calendarId })
    : undefined;
  return { events: [event], timeZone, complete: true };
}

function startedBeforeReminder({
  entry,
  anchor,
  nowMs,
}: {
  entry: DueEntry;
  anchor: 'start' | 'end';
  nowMs: number;
}): boolean {
  return (
    anchor === 'start' &&
    entry.scheduledMs < entry.startMs &&
    nowMs >= entry.startMs
  );
}

function toDueEntry({
  event,
  anchor,
  leadMs,
  timeZone,
}: {
  event: GoogleCalendarEvent;
  anchor: 'start' | 'end';
  leadMs: number;
  timeZone: string | undefined;
}): DueEntry | null {
  const anchorMs = rangeEvents.boundaryMs({ event, anchor, timeZone });
  if (isNil(anchorMs)) {
    return null;
  }
  const startMs =
    anchor === 'start'
      ? anchorMs
      : rangeEvents.boundaryMs({ event, anchor: 'start', timeZone });
  if (isNil(startMs)) {
    return null;
  }
  const scheduledMs = anchorMs - leadMs;
  const createdMs = Date.parse(event.created);
  const bookedLate =
    anchor === 'start' &&
    !Number.isNaN(createdMs) &&
    createdMs > scheduledMs &&
    createdMs <= anchorMs;
  return {
    event,
    key: `${event.id}@${anchorMs}`,
    dueMs: bookedLate ? createdMs : scheduledMs,
    scheduledMs,
    startMs,
  };
}

function firedByPreviousVersion({
  entry,
  anchor,
  leadMs,
  legacy,
}: {
  entry: DueEntry;
  anchor: 'start' | 'end';
  leadMs: number;
  legacy: LegacyMarker;
}): boolean {
  const boundary = anchor === 'start' ? entry.event.start : entry.event.end;
  const previousAnchorMs = Date.parse(
    String(boundary?.dateTime ?? boundary?.date)
  );
  if (Number.isNaN(previousAnchorMs)) {
    return false;
  }
  const createdMs = Date.parse(entry.event.created);
  const existedBeforeUpgrade =
    Number.isNaN(createdMs) || createdMs <= legacy.upgradedAtMs;
  const withinPreviousWindow =
    anchor === 'end' ||
    entry.scheduledMs <= legacy.upgradedAtMs + PREVIOUS_VERSION_WINDOW_MS;
  return (
    existedBeforeUpgrade &&
    withinPreviousWindow &&
    previousAnchorMs - leadMs <= legacy.lastPollMs
  );
}

function keepLegacy({
  legacy,
  dueThroughMs,
}: {
  legacy: LegacyMarker | undefined;
  dueThroughMs: number;
}): { legacy?: LegacyMarker } {
  if (isNil(legacy) || dueThroughMs - VISIBILITY_MARGIN_MS > legacy.untilMs) {
    return {};
  }
  return { legacy };
}

function startPass({
  checkpoint,
  nowMs,
  leadMs,
  logPrefix,
}: {
  checkpoint: DueCheckpoint;
  nowMs: number;
  leadMs: number;
  logPrefix: string;
}): ListingPass {
  const uncappedFromMs = Math.max(
    checkpoint.dueThroughMs - VISIBILITY_MARGIN_MS,
    checkpoint.floorMs
  );
  const fromMs = Math.max(uncappedFromMs, nowMs - LOOKBACK_CAP_MS);
  if (fromMs > uncappedFromMs) {
    console.warn(
      `${logPrefix}: the last check was more than 7 days ago; only times after ${new Date(
        fromMs
      ).toISOString()} are checked, earlier ones are skipped.`
    );
  }
  return {
    fromMs,
    throughMs: nowMs,
    timeMinMs: fromMs - ALL_DAY_SLACK_MS,
    timeMaxMs: nowMs + leadMs + ALL_DAY_SLACK_MS,
  };
}

async function listPass({
  auth,
  calendarId,
  pass,
  nowMs,
  logPrefix,
}: {
  auth: GoogleCalendarAuthValue;
  calendarId: string;
  pass: ListingPass;
  nowMs: number;
  logPrefix: string;
}): Promise<RangeListing> {
  const request = {
    auth,
    calendarId,
    timeMinMs: pass.timeMinMs,
    timeMaxMs: pass.timeMaxMs,
    deadlineMs: nowMs + LISTING_BUDGET_MS,
    logPrefix,
  };
  if (isNil(pass.pageToken)) {
    return rangeEvents.listEventsInRange(request);
  }
  const resumed = await tryCatch(() =>
    rangeEvents.listEventsInRange({
      ...request,
      startPageToken: pass.pageToken,
    })
  );
  if (resumed.error === null) {
    return resumed.data;
  }
  if (
    !REJECTED_TOKEN_STATUSES.includes(
      eventScan.httpStatusOf(resumed.error) ?? 0
    )
  ) {
    throw resumed.error;
  }
  console.warn(
    `${logPrefix}: Google rejected the saved page position; listing the same window again from the first page. Items already fired are skipped.`
  );
  return rangeEvents.listEventsInRange(request);
}

function limitSeen({
  checkpoint,
  listedThroughStartMs,
  logPrefix,
}: {
  checkpoint: DueCheckpoint;
  listedThroughStartMs: number | null;
  logPrefix: string;
}): DueCheckpoint {
  const keepAfterMs = Math.max(
    checkpoint.dueThroughMs - VISIBILITY_MARGIN_MS,
    checkpoint.floorMs
  );
  const stillNeeded = checkpoint.seen
    .filter(
      (entry) =>
        entry.untilMs > keepAfterMs &&
        !isCoveredBy({
          entry: { dueMs: entry.untilMs, startMs: entry.startMs },
          handled: checkpoint.handled,
        })
    )
    .sort((left, right) => right.untilMs - left.untilMs);
  const fitting = fittingSeenCount({
    seen: stillNeeded,
    maxEntries: SEEN_LIMIT,
  });
  if (fitting === stillNeeded.length) {
    return { ...checkpoint, seen: stillNeeded };
  }
  if (isNil(checkpoint.pass)) {
    const cutMs = stillNeeded[Math.max(fitting, 1) - 1].untilMs;
    console.warn(
      `${logPrefix}: too many fired items are still inside the check window; items due at or before ${new Date(
        cutMs
      ).toISOString()} that were not fired yet will not fire.`
    );
    return {
      ...checkpoint,
      floorMs: Math.max(checkpoint.floorMs, cutMs),
      seen: stillNeeded.filter((entry) => entry.untilMs > cutMs),
    };
  }
  return compactUnfinishedPass({
    checkpoint,
    stillNeeded,
    removeCount: stillNeeded.length - fitting,
    listedThroughStartMs,
    logPrefix,
  });
}

function compactUnfinishedPass({
  checkpoint,
  stillNeeded,
  removeCount,
  listedThroughStartMs,
  logPrefix,
}: {
  checkpoint: DueCheckpoint;
  stillNeeded: SeenDue[];
  removeCount: number;
  listedThroughStartMs: number | null;
  logPrefix: string;
}): DueCheckpoint {
  const removable = isNil(listedThroughStartMs)
    ? []
    : stillNeeded
        .filter(
          (entry) =>
            !isNil(entry.startMs) && entry.startMs < listedThroughStartMs
        )
        .sort((left, right) => left.untilMs - right.untilMs)
        .slice(0, removeCount);
  const removedKeys = new Set(removable.map((entry) => entry.key));
  const markStartMs =
    listedThroughStartMs ??
    checkpoint.handled?.startMs ??
    Number.MIN_SAFE_INTEGER;
  const marked: HandledMark = {
    dueMs: maxUntilMs({
      entries: removable,
      startMs: checkpoint.handled?.dueMs ?? Number.MIN_SAFE_INTEGER,
    }),
    startMs: markStartMs,
  };
  const remaining = stillNeeded.filter(
    (entry) =>
      !removedKeys.has(entry.key) &&
      !isCoveredBy({
        entry: { dueMs: entry.untilMs, startMs: entry.startMs },
        handled: marked,
      })
  );
  const fitting = fittingSeenCount({
    seen: remaining,
    maxEntries: Number.MAX_SAFE_INTEGER,
  });
  if (fitting === remaining.length) {
    return { ...checkpoint, handled: marked, seen: remaining };
  }
  const dropped = remaining.slice(fitting);
  console.warn(
    `${logPrefix}: too many fired items share the last listed start time in an unfinished listing; forgetting the ${dropped.length} oldest. If Google rejects the saved page position before the listing finishes, those can fire again.`
  );
  return {
    ...checkpoint,
    handled: {
      dueMs: maxUntilMs({ entries: dropped, startMs: marked.dueMs }),
      startMs: markStartMs,
    },
    seen: remaining.slice(0, fitting),
  };
}

function fittingSeenCount({
  seen,
  maxEntries,
}: {
  seen: SeenDue[];
  maxEntries: number;
}): number {
  return eventScan.fittingCount({
    entries: seen,
    maxEntries,
    maxChars: eventScan.seenMaxChars,
  });
}

function maxUntilMs({
  entries,
  startMs,
}: {
  entries: SeenDue[];
  startMs: number;
}): number {
  return entries.reduce((max, entry) => Math.max(max, entry.untilMs), startMs);
}

function isCoveredBy({
  entry,
  handled,
}: {
  entry: { dueMs: number; startMs: number | undefined };
  handled: HandledMark | undefined;
}): boolean {
  return (
    !isNil(handled) &&
    !isNil(entry.startMs) &&
    entry.dueMs <= handled.dueMs &&
    entry.startMs < handled.startMs
  );
}

function lastListedStartMs({
  listing,
}: {
  listing: RangeListing;
}): number | null {
  const starts = listing.events
    .map((event) =>
      rangeEvents.boundaryMs({
        event,
        anchor: 'start',
        timeZone: listing.timeZone,
      })
    )
    .filter((startMs): startMs is number => !isNil(startMs));
  return starts.length === 0 ? null : starts[starts.length - 1];
}

async function readCheckpoint({
  store,
  storeKey,
  watchKey,
  legacyResume,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
  legacyResume: LegacyResume;
}): Promise<DueCheckpoint | null> {
  const saved = await store.get<DueCheckpoint>(storeKey);
  if (!isNil(saved)) {
    if (saved.watchKey !== watchKey || typeof saved.dueThroughMs !== 'number') {
      return null;
    }
    return {
      watchKey,
      dueThroughMs: saved.dueThroughMs,
      floorMs:
        typeof saved.floorMs === 'number' ? saved.floorMs : saved.dueThroughMs,
      seen: Array.isArray(saved.seen) ? saved.seen : [],
      ...(isLegacyMarker(saved.legacy) ? { legacy: saved.legacy } : {}),
      ...(isListingPass(saved.pass) ? { pass: saved.pass } : {}),
      ...(isListingPass(saved.pass) && isHandledMark(saved.handled)
        ? { handled: saved.handled }
        : {}),
    };
  }
  const legacyLastPoll = await store.get<number>(LEGACY_LAST_POLL_STORE_KEY);
  if (typeof legacyLastPoll !== 'number' || !Number.isFinite(legacyLastPoll)) {
    return null;
  }
  const upgradedAtMs = Date.now();
  const resumeMs =
    (legacyResume === 'after-last-poll' ? legacyLastPoll : upgradedAtMs) -
    ALL_DAY_SLACK_MS;
  return {
    watchKey,
    dueThroughMs: resumeMs,
    floorMs: resumeMs,
    seen: [],
    legacy: {
      lastPollMs: legacyLastPoll,
      upgradedAtMs,
      untilMs:
        Math.max(legacyLastPoll, upgradedAtMs + PREVIOUS_VERSION_WINDOW_MS) +
        ALL_DAY_SLACK_MS,
    },
  };
}

function isListingPass(value: unknown): value is ListingPass {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fromMs' in value &&
    typeof value.fromMs === 'number' &&
    'throughMs' in value &&
    typeof value.throughMs === 'number' &&
    'timeMinMs' in value &&
    typeof value.timeMinMs === 'number' &&
    'timeMaxMs' in value &&
    typeof value.timeMaxMs === 'number' &&
    'pageToken' in value &&
    typeof value.pageToken === 'string'
  );
}

function isHandledMark(value: unknown): value is HandledMark {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dueMs' in value &&
    typeof value.dueMs === 'number' &&
    'startMs' in value &&
    typeof value.startMs === 'number'
  );
}

function isLegacyMarker(value: unknown): value is LegacyMarker {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lastPollMs' in value &&
    typeof value.lastPollMs === 'number' &&
    'upgradedAtMs' in value &&
    typeof value.upgradedAtMs === 'number' &&
    'untilMs' in value &&
    typeof value.untilMs === 'number'
  );
}

async function saveBaseline({
  store,
  storeKey,
  watchKey,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
}): Promise<void> {
  const nowMs = Date.now();
  await store.put<DueCheckpoint>(storeKey, {
    watchKey,
    dueThroughMs: nowMs,
    floorMs: nowMs,
    seen: [],
  });
}

export const rangeReminders = {
  enable,
  poll,
};

export type LegacyResume = 'after-last-poll' | 'from-upgrade-time';

type DueCheckpoint = {
  watchKey: string;
  dueThroughMs: number;
  floorMs: number;
  seen: SeenDue[];
  legacy?: LegacyMarker;
  pass?: ListingPass;
  handled?: HandledMark;
};

type HandledMark = {
  dueMs: number;
  startMs: number;
};

type ListingPass = {
  fromMs: number;
  throughMs: number;
  timeMinMs: number;
  timeMaxMs: number;
  pageToken?: string;
};

type LegacyMarker = {
  lastPollMs: number;
  upgradedAtMs: number;
  untilMs: number;
};

type SeenDue = {
  key: string;
  untilMs: number;
  startMs?: number;
};

type DueEntry = {
  event: GoogleCalendarEvent;
  key: string;
  dueMs: number;
  scheduledMs: number;
  startMs: number;
};
