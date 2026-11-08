import { isNil, Store } from '@activepieces/pieces-framework';
import { GoogleCalendarAuthValue } from '.';
import { rangeEvents, RangeListing } from './range-events';
import { GoogleCalendarEvent } from './types';

const LEGACY_LAST_POLL_STORE_KEY = 'lastPoll';
const LISTING_BUDGET_MS = 25_000;
const VISIBILITY_MARGIN_MS = 60_000;
const ALL_DAY_SLACK_MS = 14 * 60 * 60 * 1000;
const LOOKBACK_CAP_MS = 7 * 24 * 60 * 60 * 1000;
const SEEN_LIMIT = 1000;
const PREVIOUS_VERSION_WINDOW_MS = 5 * 60 * 1000;

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
  const listing = isNil(eventId)
    ? await rangeEvents.listEventsInRange({
        auth,
        calendarId,
        timeMinMs: fromMs - ALL_DAY_SLACK_MS,
        timeMaxMs: nowMs + leadMs + ALL_DAY_SLACK_MS,
        deadlineMs: nowMs + LISTING_BUDGET_MS,
        logPrefix,
      })
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
        entry.dueMs <= nowMs &&
        !seenKeys.has(entry.key) &&
        (isNil(legacy) ||
          !firedByPreviousVersion({ entry, anchor, leadMs, legacy }))
    )
    .sort((left, right) => left.dueMs - right.dueMs);
  const dueThroughMs = listing.complete
    ? Math.max(checkpoint.dueThroughMs, nowMs)
    : Math.max(
        checkpoint.dueThroughMs,
        Math.min(
          nowMs,
          safeAdvanceMs({ listing, leadMs }) ?? checkpoint.dueThroughMs
        )
      );
  await store.put<DueCheckpoint>(
    storeKey,
    limitSeen({
      checkpoint: {
        watchKey,
        dueThroughMs,
        floorMs: checkpoint.floorMs,
        ...keepLegacy({ legacy, dueThroughMs }),
        seen: [
          ...checkpoint.seen,
          ...due.map((entry) => ({ key: entry.key, untilMs: entry.dueMs })),
        ],
      },
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

function safeAdvanceMs({
  listing,
  leadMs,
}: {
  listing: RangeListing;
  leadMs: number;
}): number | null {
  const last = listing.events[listing.events.length - 1];
  if (isNil(last)) {
    return null;
  }
  const lastStartMs = rangeEvents.boundaryMs({
    event: last,
    anchor: 'start',
    timeZone: listing.timeZone,
  });
  if (isNil(lastStartMs)) {
    return null;
  }
  return lastStartMs - leadMs - ALL_DAY_SLACK_MS;
}

function limitSeen({
  checkpoint,
  logPrefix,
}: {
  checkpoint: DueCheckpoint;
  logPrefix: string;
}): DueCheckpoint {
  const keepAfterMs = Math.max(
    checkpoint.dueThroughMs - VISIBILITY_MARGIN_MS,
    checkpoint.floorMs
  );
  const stillNeeded = checkpoint.seen
    .filter((entry) => entry.untilMs > keepAfterMs)
    .sort((left, right) => right.untilMs - left.untilMs);
  if (stillNeeded.length <= SEEN_LIMIT) {
    return { ...checkpoint, seen: stillNeeded };
  }
  const cutMs = stillNeeded[SEEN_LIMIT - 1].untilMs;
  console.warn(
    `${logPrefix}: more than ${SEEN_LIMIT} fired items are still inside the check window; items due at or before ${new Date(
      cutMs
    ).toISOString()} that were not fired yet will not fire.`
  );
  return {
    ...checkpoint,
    floorMs: Math.max(checkpoint.floorMs, cutMs),
    seen: stillNeeded.filter((entry) => entry.untilMs > cutMs),
  };
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
    if (
      saved.watchKey !== watchKey ||
      typeof saved.dueThroughMs !== 'number'
    ) {
      return null;
    }
    return {
      watchKey,
      dueThroughMs: saved.dueThroughMs,
      floorMs:
        typeof saved.floorMs === 'number' ? saved.floorMs : saved.dueThroughMs,
      seen: Array.isArray(saved.seen) ? saved.seen : [],
      ...(isLegacyMarker(saved.legacy) ? { legacy: saved.legacy } : {}),
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
};

type LegacyMarker = {
  lastPollMs: number;
  upgradedAtMs: number;
  untilMs: number;
};

type SeenDue = {
  key: string;
  untilMs: number;
};

type DueEntry = {
  event: GoogleCalendarEvent;
  key: string;
  dueMs: number;
  scheduledMs: number;
};
