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
const SEEN_MAX_CHARS = 150_000;
const LEGACY_RESUME_LIMIT_MS = 24 * 60 * 60 * 1000;

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
  const resume = validResume({ resume: checkpoint.resume });
  const scanStartedMs = resume?.startedMs ?? Date.now();
  const updatedMinMs = resume?.updatedMinMs ?? checkpoint.scannedThroughMs;
  const seenAtStart = new Map(checkpoint.seen.map((entry) => [entry.id, entry]));
  const seenById = new Map(seenAtStart);
  const listedById = new Map<string, ListedEvent>();
  let maxUpdatedMs = checkpoint.scannedThroughMs;
  let pageToken: string | undefined = resume?.pageToken;
  let pagesScanned = 0;
  let finishedCleanly = false;
  while (true) {
    if (deadlineMs - Date.now() < REQUEST_TIMEOUT_MS) {
      console.info(
        `[google-calendar] ${triggerName}: listing budget reached after ${pagesScanned} page(s); continuing from ${
          pageToken ? 'the next page' : new Date(maxUpdatedMs).toISOString()
        } on the next check.`
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
          updatedMinMs,
          pageToken,
        })
      )
    );
    if (response.error) {
      const status = httpStatusOf(response.error);
      if (pagesScanned === 0 && !isNil(resume) && (status === 400 || status === 410)) {
        console.warn(
          `[google-calendar] ${triggerName}: Google rejected the saved page position (HTTP ${status}); listing again from ${new Date(
            checkpoint.scannedThroughMs
          ).toISOString()}.`
        );
        return scanUpdatedEvents({
          auth,
          calendarId,
          query,
          eventTypes,
          checkpoint: withoutResume({ checkpoint }),
          deadlineMs,
          triggerName,
        });
      }
      if (pagesScanned === 0 && status === 410) {
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
      if (Number.isNaN(updatedMs) || updatedMs < updatedMinMs) {
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
  const passedDropMs = resume?.droppedThroughMs;
  const scannedThroughMs = finishedCleanly
    ? Math.max(
        checkpoint.scannedThroughMs,
        scanStartedMs - VISIBILITY_MARGIN_MS,
        isNil(passedDropMs) ? Number.NEGATIVE_INFINITY : passedDropMs + 1
      )
    : maxUpdatedMs;
  const createdFloorMs = finishedCleanly
    ? Math.max(checkpoint.createdFloorMs, scannedThroughMs)
    : checkpoint.createdFloorMs;
  const limited = limitSeen({
    seen: Array.from(seenById.values()),
    scannedThroughMs,
    createdFloorMs,
    readThroughMs: finishedCleanly ? Number.POSITIVE_INFINITY : maxUpdatedMs,
    triggerName,
  });
  const droppedThroughMs = Math.max(
    passedDropMs ?? Number.NEGATIVE_INFINITY,
    limited.droppedThroughMs ?? Number.NEGATIVE_INFINITY
  );
  const nextResume: ScanResume | undefined =
    !finishedCleanly && pageToken
      ? {
          pageToken,
          updatedMinMs,
          startedMs: scanStartedMs,
          ...(Number.isFinite(droppedThroughMs) ? { droppedThroughMs } : {}),
        }
      : undefined;
  return {
    kind: 'scanned',
    listed: Array.from(listedById.values()),
    checkpoint: {
      watchKey: checkpoint.watchKey,
      scannedThroughMs: limited.scannedThroughMs,
      createdFloorMs: limited.createdFloorMs,
      seen: limited.seen,
      ...(isNil(nextResume) ? {} : { resume: nextResume }),
    },
  };
}

function validResume({
  resume,
}: {
  resume: ScanResume | undefined;
}): ScanResume | undefined {
  if (
    !isNil(resume) &&
    typeof resume.pageToken === 'string' &&
    resume.pageToken.length > 0 &&
    Number.isFinite(resume.updatedMinMs) &&
    Number.isFinite(resume.startedMs)
  ) {
    return {
      pageToken: resume.pageToken,
      updatedMinMs: resume.updatedMinMs,
      startedMs: resume.startedMs,
      ...(typeof resume.droppedThroughMs === 'number' &&
      Number.isFinite(resume.droppedThroughMs)
        ? { droppedThroughMs: resume.droppedThroughMs }
        : {}),
    };
  }
  return undefined;
}

function withoutResume({
  checkpoint,
}: {
  checkpoint: ScanCheckpoint;
}): ScanCheckpoint {
  return {
    watchKey: checkpoint.watchKey,
    scannedThroughMs: checkpoint.scannedThroughMs,
    createdFloorMs: checkpoint.createdFloorMs,
    seen: checkpoint.seen,
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
  const checkpoint = await readCheckpoint({
    store,
    storeKey,
    watchKey,
    triggerName,
  });
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
  triggerName,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
  isRepublish: boolean | undefined;
  triggerName: string;
}): Promise<void> {
  if (isRepublish) {
    const existing = await readCheckpoint({
      store,
      storeKey,
      watchKey,
      triggerName,
    });
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
  triggerName,
}: {
  store: Store;
  storeKey: string;
  watchKey: string;
  triggerName: string;
}): Promise<ScanCheckpoint | null> {
  const saved = await store.get<ScanCheckpoint>(storeKey);
  if (!isNil(saved)) {
    if (saved.watchKey !== watchKey) {
      return null;
    }
    const resume = validResume({ resume: saved.resume });
    return {
      watchKey,
      scannedThroughMs: saved.scannedThroughMs,
      createdFloorMs:
        typeof saved.createdFloorMs === 'number'
          ? saved.createdFloorMs
          : saved.scannedThroughMs,
      seen: Array.isArray(saved.seen) ? saved.seen : [],
      ...(isNil(resume) ? {} : { resume }),
    };
  }
  const legacyLastPoll = await readLegacyLastPoll({ store });
  if (isNil(legacyLastPoll)) {
    return null;
  }
  const resumeFromMs = legacyResumeFrom({ legacyLastPoll, triggerName });
  return {
    watchKey,
    scannedThroughMs: resumeFromMs,
    createdFloorMs: resumeFromMs,
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

function legacyResumeFrom({
  legacyLastPoll,
  triggerName,
}: {
  legacyLastPoll: number;
  triggerName: string;
}): number {
  const savedFromMs = legacyLastPoll + 1;
  const limitMs = Date.now() - LEGACY_RESUME_LIMIT_MS;
  if (savedFromMs >= limitMs) {
    return savedFromMs;
  }
  const skippedFrom = new Date(savedFromMs).toISOString();
  const resumeFrom = new Date(limitMs).toISOString();
  console.warn(
    `[google-calendar] ${triggerName}: the position saved by the previous version (${skippedFrom}) is more than 24 hours old. Changes between ${skippedFrom} and ${resumeFrom} were skipped and will not fire; continuing from ${resumeFrom}.`
  );
  return limitMs;
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
  readThroughMs,
  triggerName,
}: {
  seen: SeenEvent[];
  scannedThroughMs: number;
  createdFloorMs: number;
  readThroughMs: number;
  triggerName: string;
}): LimitedSeen {
  const stillNeeded = seen
    .filter(
      (entry) =>
        entry.updatedMs >= scannedThroughMs || entry.createdMs >= createdFloorMs
    )
    .sort((left, right) => right.updatedMs - left.updatedMs);
  const fitting = fittingCount({
    entries: stillNeeded,
    maxEntries: SEEN_LIMIT,
    maxChars: SEEN_MAX_CHARS,
  });
  if (fitting === stillNeeded.length) {
    return { scannedThroughMs, createdFloorMs, seen: stillNeeded };
  }
  const cutMs = stillNeeded[fitting].updatedMs;
  const groupFullyRead = readThroughMs > cutMs;
  const passMs = groupFullyRead ? cutMs + 1 : cutMs;
  const dropped = stillNeeded.length - fitting;
  console.warn(
    `[google-calendar] ${triggerName}: more changes inside the visibility margin than the saved state can hold (${stillNeeded.length} entries); checkpoint advanced past the visibility margin to ${new Date(
      passMs
    ).toISOString()} and ${dropped} or more older entries were dropped. Events that become visible later than that with an older timestamp are not picked up.${
      groupFullyRead
        ? ''
        : ' The saved page position continues the listing; if Google rejects it, changes at that timestamp may fire again.'
    }`
  );
  return {
    scannedThroughMs: Math.max(scannedThroughMs, passMs),
    createdFloorMs: Math.max(createdFloorMs, passMs),
    seen: stillNeeded.filter((entry) => entry.updatedMs > cutMs),
    ...(groupFullyRead ? {} : { droppedThroughMs: cutMs }),
  };
}

function fittingCount<T>({
  entries,
  maxEntries,
  maxChars,
}: {
  entries: T[];
  maxEntries: number;
  maxChars: number;
}): number {
  let usedChars = 0;
  for (let index = 0; index < entries.length; index++) {
    usedChars += JSON.stringify(entries[index]).length + 1;
    if (index >= maxEntries || usedChars > maxChars) {
      return index;
    }
  }
  return entries.length;
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
  fittingCount,
  seenMaxChars: SEEN_MAX_CHARS,
};

export type ScanCheckpoint = {
  watchKey: string;
  scannedThroughMs: number;
  createdFloorMs: number;
  seen: SeenEvent[];
  resume?: ScanResume;
};

export type ScanResume = {
  pageToken: string;
  updatedMinMs: number;
  startedMs: number;
  droppedThroughMs?: number;
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

type LimitedSeen = Pick<
  ScanCheckpoint,
  'scannedThroughMs' | 'createdFloorMs' | 'seen'
> & { droppedThroughMs?: number };

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
