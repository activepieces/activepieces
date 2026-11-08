import {
  AppConnectionValueForAuthProperty,
  isNil,
  Store,
  tryCatch,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { googleCalendarAuth, getAccessToken } from '../auth';
import { googleCalendarCommon } from './index';
import { GoogleCalendarEvent } from './types';

const PAGE_SIZE = '2500';
const LEGACY_LAST_POLL_STORE_KEY = 'lastPoll';
const LISTING_BUDGET_MS = 25_000;
const REQUEST_TIMEOUT_MS = 10_000;
const VISIBILITY_MARGIN_MS = 60_000;
const SEEN_LIMIT = 500;

async function scanUpdatedEvents({
  auth,
  calendarId,
  query,
  eventTypes,
  checkpoint,
  deadlineMs,
  triggerName,
}: {
  auth: AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;
  calendarId: string;
  query: Record<string, string>;
  eventTypes?: string[];
  checkpoint: ScanCheckpoint;
  deadlineMs: number;
  triggerName: string;
}): Promise<ScanResult> {
  const token = await getAccessToken(auth);
  const scanStartedMs = Date.now();
  const seenAtStart = new Map(checkpoint.seen.map((entry) => [entry.id, entry]));
  const seenById = new Map(seenAtStart);
  const listedById = new Map<string, ListedEvent>();
  let maxUpdatedMs = checkpoint.scannedThroughMs;
  let pageToken: string | undefined = undefined;
  let pagesScanned = 0;
  let finishedCleanly = false;
  while (true) {
    if (deadlineMs - Date.now() < REQUEST_TIMEOUT_MS) {
      console.info(
        `[google-calendar] ${triggerName}: listing budget reached after ${pagesScanned} page(s); continuing from ${new Date(
          maxUpdatedMs
        ).toISOString()} on the next check.`
      );
      break;
    }
    const response = await tryCatch(() =>
      httpClient.sendRequest<GoogleCalendarEventPage>(
        buildListRequest({
          calendarId,
          query,
          eventTypes,
          token,
          updatedMinMs: checkpoint.scannedThroughMs,
          pageToken,
        })
      )
    );
    if (response.error) {
      if (pagesScanned === 0 && httpStatusOf(response.error) === 410) {
        return { kind: 'expired' };
      }
      if (pagesScanned === 0) {
        throw response.error;
      }
      console.warn(
        `[google-calendar] ${triggerName}: page ${pagesScanned + 1} failed; keeping ${pagesScanned} scanned page(s) and retrying the rest on the next check.`,
        response.error
      );
      break;
    }
    for (const event of response.data.body.items ?? []) {
      const updatedMs = Date.parse(event.updated);
      if (Number.isNaN(updatedMs) || updatedMs < checkpoint.scannedThroughMs) {
        continue;
      }
      const previous = seenById.get(event.id);
      const isLatest = isNil(previous) || updatedMs >= previous.updatedMs;
      seenById.set(event.id, {
        id: event.id,
        updatedMs: Math.max(updatedMs, previous?.updatedMs ?? updatedMs),
        createdMs: createdTimeOf({ event }),
        cancelled: isLatest
          ? event.status === 'cancelled'
          : previous.cancelled === true,
      });
      maxUpdatedMs = Math.max(maxUpdatedMs, updatedMs);
      listedById.set(event.id, {
        event,
        updatedMs,
        firstSight:
          listedById.get(event.id)?.firstSight ?? !seenAtStart.has(event.id),
        previous: seenAtStart.get(event.id),
      });
    }
    pagesScanned += 1;
    pageToken = response.data.body.nextPageToken;
    if (!pageToken) {
      finishedCleanly = true;
      break;
    }
  }
  const scannedThroughMs = finishedCleanly
    ? Math.max(checkpoint.scannedThroughMs, scanStartedMs - VISIBILITY_MARGIN_MS)
    : maxUpdatedMs;
  const createdFloorMs = finishedCleanly
    ? Math.max(checkpoint.createdFloorMs, scannedThroughMs)
    : checkpoint.createdFloorMs;
  return {
    kind: 'scanned',
    listed: Array.from(listedById.values()),
    checkpoint: {
      watchKey: checkpoint.watchKey,
      ...limitSeen({
        seen: Array.from(seenById.values()),
        scannedThroughMs,
        createdFloorMs,
        triggerName,
      }),
    },
  };
}

async function pollUpdatedEvents({
  auth,
  store,
  storeKey,
  watchKey,
  calendarId,
  query,
  triggerName,
  skippedItems,
}: {
  auth: AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;
  store: Store;
  storeKey: string;
  watchKey: string;
  calendarId: string;
  query: Record<string, string>;
  triggerName: string;
  skippedItems: string;
}): Promise<ListedEvent[]> {
  const deadlineMs = Date.now() + LISTING_BUDGET_MS;
  const checkpoint = await readCheckpoint({ store, storeKey, watchKey });
  if (isNil(checkpoint)) {
    await store.put<ScanCheckpoint>(storeKey, baselineCheckpoint({ watchKey }));
    return [];
  }
  const scan = await scanUpdatedEvents({
    auth,
    calendarId,
    query,
    checkpoint,
    deadlineMs,
    triggerName,
  });
  if (scan.kind === 'expired') {
    warnExpired({
      triggerName,
      skippedItems,
      scannedThroughMs: checkpoint.scannedThroughMs,
    });
    await store.put<ScanCheckpoint>(storeKey, baselineCheckpoint({ watchKey }));
    return [];
  }
  await store.put<ScanCheckpoint>(storeKey, scan.checkpoint);
  return scan.listed;
}

async function sampleUpdatedEvents({
  auth,
  calendarId,
  query,
  eventTypes,
  lookbackMs,
  triggerName,
}: {
  auth: AppConnectionValueForAuthProperty<typeof googleCalendarAuth>;
  calendarId: string;
  query: Record<string, string>;
  eventTypes?: string[];
  lookbackMs: number;
  triggerName: string;
}): Promise<ListedEvent[]> {
  const sampleFromMs = Date.now() - lookbackMs;
  const scan = await scanUpdatedEvents({
    auth,
    calendarId,
    query,
    eventTypes,
    checkpoint: {
      watchKey: '',
      scannedThroughMs: sampleFromMs,
      createdFloorMs: sampleFromMs,
      seen: [],
    },
    deadlineMs: Date.now() + LISTING_BUDGET_MS,
    triggerName,
  });
  return scan.kind === 'expired' ? [] : scan.listed;
}

async function restoreOrBaseline({
  store,
  storeKey,
  watchKey,
  isRepublish,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
  isRepublish: boolean | undefined;
}): Promise<void> {
  if (isRepublish) {
    const existing = await readCheckpoint({ store, storeKey, watchKey });
    if (!isNil(existing)) {
      await store.put<ScanCheckpoint>(storeKey, existing);
      return;
    }
  }
  await store.put<ScanCheckpoint>(storeKey, baselineCheckpoint({ watchKey }));
}

async function readCheckpoint({
  store,
  storeKey,
  watchKey,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
}): Promise<ScanCheckpoint | null> {
  const saved = await store.get<ScanCheckpoint>(storeKey);
  if (!isNil(saved)) {
    if (saved.watchKey !== watchKey) {
      return null;
    }
    return {
      watchKey,
      scannedThroughMs: saved.scannedThroughMs,
      createdFloorMs:
        typeof saved.createdFloorMs === 'number'
          ? saved.createdFloorMs
          : saved.scannedThroughMs,
      seen: Array.isArray(saved.seen) ? saved.seen : [],
    };
  }
  const legacyLastPoll = await readLegacyLastPoll({ store });
  if (isNil(legacyLastPoll)) {
    return null;
  }
  return {
    watchKey,
    scannedThroughMs: legacyLastPoll + 1,
    createdFloorMs: legacyLastPoll + 1,
    seen: [],
  };
}

async function readLegacyLastPoll({
  store,
}: {
  store: Store;
}): Promise<number | null> {
  const legacyLastPoll = await store.get<number>(LEGACY_LAST_POLL_STORE_KEY);
  if (typeof legacyLastPoll === 'number' && Number.isFinite(legacyLastPoll)) {
    return legacyLastPoll;
  }
  return null;
}

function baselineCheckpoint({ watchKey }: { watchKey: string }): ScanCheckpoint {
  const baselineMs = Date.now() + 1;
  return {
    watchKey,
    scannedThroughMs: baselineMs,
    createdFloorMs: baselineMs,
    seen: [],
  };
}

function warnExpired({
  triggerName,
  skippedItems,
  scannedThroughMs,
}: {
  triggerName: string;
  skippedItems: string;
  scannedThroughMs: number;
}): void {
  const skippedFrom = new Date(scannedThroughMs).toISOString();
  console.warn(
    `[google-calendar] ${triggerName}: Google answered 410 for updatedMin ${skippedFrom} (too long ago; the flow was off or its saved position is from an older version). ${skippedItems} between ${skippedFrom} and now were skipped and will not fire; watching again from now.`
  );
}

function limitSeen({
  seen,
  scannedThroughMs,
  createdFloorMs,
  triggerName,
}: {
  seen: SeenEvent[];
  scannedThroughMs: number;
  createdFloorMs: number;
  triggerName: string;
}): Pick<ScanCheckpoint, 'scannedThroughMs' | 'createdFloorMs' | 'seen'> {
  const stillNeeded = seen
    .filter(
      (entry) =>
        entry.updatedMs >= scannedThroughMs || entry.createdMs >= createdFloorMs
    )
    .sort((left, right) => right.updatedMs - left.updatedMs);
  if (stillNeeded.length <= SEEN_LIMIT) {
    return { scannedThroughMs, createdFloorMs, seen: stillNeeded };
  }
  const cutMs = stillNeeded[SEEN_LIMIT - 1].updatedMs;
  console.warn(
    `[google-calendar] ${triggerName}: more than ${SEEN_LIMIT} changes inside the visibility margin; checkpoint advanced past the visibility margin to ${new Date(
      cutMs
    ).toISOString()}. Events that become visible later than that with an older timestamp are not picked up.`
  );
  return {
    scannedThroughMs: Math.max(scannedThroughMs, cutMs),
    createdFloorMs: Math.max(createdFloorMs, cutMs),
    seen: stillNeeded.filter((entry) => entry.updatedMs >= cutMs),
  };
}

function createdTimeOf({ event }: { event: GoogleCalendarEvent }): number {
  const createdMs = Date.parse(event.created);
  return Number.isNaN(createdMs) ? 0 : createdMs;
}

function buildListRequest({
  calendarId,
  query,
  eventTypes,
  token,
  updatedMinMs,
  pageToken,
}: {
  calendarId: string;
  query: Record<string, string>;
  eventTypes: string[] | undefined;
  token: string;
  updatedMinMs: number;
  pageToken: string | undefined;
}): HttpRequest {
  let url = `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`;
  if (eventTypes && eventTypes.length > 0) {
    url += `?${eventTypes
      .map((type) => `eventTypes=${encodeURIComponent(type)}`)
      .join('&')}`;
  }
  return {
    method: HttpMethod.GET,
    url,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams: {
      ...query,
      orderBy: 'updated',
      updatedMin: new Date(updatedMinMs).toISOString(),
      maxResults: PAGE_SIZE,
      ...(pageToken ? { pageToken } : {}),
    },
    timeout: REQUEST_TIMEOUT_MS,
  };
}

function httpStatusOf(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status;
  }
  return undefined;
}

export const eventScan = {
  listingBudgetMs: LISTING_BUDGET_MS,
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  scanUpdatedEvents,
  pollUpdatedEvents,
  sampleUpdatedEvents,
  restoreOrBaseline,
  readCheckpoint,
  readLegacyLastPoll,
  baselineCheckpoint,
  warnExpired,
  createdTimeOf,
  httpStatusOf,
};

export type ScanCheckpoint = {
  watchKey: string;
  scannedThroughMs: number;
  createdFloorMs: number;
  seen: SeenEvent[];
};

export type SeenEvent = {
  id: string;
  updatedMs: number;
  createdMs: number;
  cancelled?: boolean;
};

export type ListedEvent = {
  event: GoogleCalendarEvent;
  updatedMs: number;
  firstSight: boolean;
  previous: SeenEvent | undefined;
};

type ScanResult =
  | { kind: 'expired' }
  | {
      kind: 'scanned';
      listed: ListedEvent[];
      checkpoint: ScanCheckpoint;
    };

type GoogleCalendarEventPage = {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
};
