import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
} from '@activepieces/pieces-common';
import { isNil, tryCatch } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  googleCalendarCommon,
  GoogleCalendarAuthValue,
  getAccessToken,
} from '.';
import { eventScan } from './event-scan';
import { GoogleCalendarEvent } from './types';

dayjs.extend(utc);
dayjs.extend(timezone);

const PAGE_SIZE = '2500';
const REQUEST_TIMEOUT_MS = 10_000;

async function listEventsInRange({
  auth,
  calendarId,
  timeMinMs,
  timeMaxMs,
  deadlineMs,
  logPrefix,
  startPageToken,
}: {
  auth: GoogleCalendarAuthValue;
  calendarId: string;
  timeMinMs: number;
  timeMaxMs: number;
  deadlineMs: number;
  logPrefix: string;
  startPageToken?: string;
}): Promise<RangeListing> {
  const token = await getAccessToken(auth);
  const events: GoogleCalendarEvent[] = [];
  let timeZone: string | undefined = undefined;
  let pageToken: string | undefined = startPageToken;
  let pagesListed = 0;
  while (true) {
    if (pagesListed > 0 && deadlineMs - Date.now() < REQUEST_TIMEOUT_MS) {
      console.info(
        `${logPrefix}: listing budget reached after ${pagesListed} page(s); the rest is checked on the next run.`
      );
      return { events, timeZone, complete: false, nextPageToken: pageToken };
    }
    const response = await tryCatch(() =>
      httpClient.sendRequest<RangePage>(
        buildRangeRequest({
          calendarId,
          token,
          timeMinMs,
          timeMaxMs,
          pageToken,
        })
      )
    );
    if (response.error) {
      if (pagesListed === 0) {
        throw response.error;
      }
      console.warn(
        `${logPrefix}: page ${
          pagesListed + 1
        } failed; keeping ${pagesListed} listed page(s) and checking the rest on the next run.`,
        response.error
      );
      return { events, timeZone, complete: false, nextPageToken: pageToken };
    }
    const page: HttpResponse<RangePage> = response.data;
    timeZone = timeZone ?? page.body.timeZone;
    events.push(...(page.body.items ?? []));
    pagesListed += 1;
    pageToken = page.body.nextPageToken;
    if (!pageToken) {
      return { events, timeZone, complete: true };
    }
  }
}

async function listUpcomingOrRecent({
  auth,
  calendarId,
  nowMs,
  lookbackMs,
  limit,
  anchor,
}: {
  auth: GoogleCalendarAuthValue;
  calendarId: string;
  nowMs: number;
  lookbackMs: number;
  limit: number;
  anchor: 'start' | 'end';
}): Promise<{
  upcoming: GoogleCalendarEvent[];
  recent: GoogleCalendarEvent[];
}> {
  const listing = await listEventsInRange({
    auth,
    calendarId,
    timeMinMs: nowMs - lookbackMs,
    timeMaxMs: nowMs + lookbackMs,
    deadlineMs: nowMs + 20_000,
    logPrefix: '[google-calendar] sample',
  });
  const timed = listing.events
    .filter((event) => event.status !== 'cancelled')
    .map((event) => ({
      event,
      atMs: boundaryMs({
        event,
        anchor,
        timeZone: listing.timeZone,
      }),
    }))
    .filter(
      (entry): entry is { event: GoogleCalendarEvent; atMs: number } =>
        !isNil(entry.atMs)
    );
  const upcoming = timed
    .filter((entry) => entry.atMs > nowMs)
    .sort((left, right) => left.atMs - right.atMs)
    .slice(0, limit)
    .map((entry) => entry.event);
  const recent = timed
    .filter((entry) => entry.atMs <= nowMs)
    .sort((left, right) => right.atMs - left.atMs)
    .slice(0, limit)
    .map((entry) => entry.event);
  return { upcoming, recent };
}

async function getEventOrNull({
  auth,
  calendarId,
  eventId,
}: {
  auth: GoogleCalendarAuthValue;
  calendarId: string;
  eventId: string;
}): Promise<GoogleCalendarEvent | null> {
  const token = await getAccessToken(auth);
  const response = await tryCatch(() =>
    httpClient.sendRequest<GoogleCalendarEvent>({
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
        calendarId
      )}/events/${encodeURIComponent(eventId)}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      timeout: REQUEST_TIMEOUT_MS,
    })
  );
  if (response.error) {
    const status = eventScan.httpStatusOf(response.error);
    if (status === 404 || status === 410) {
      return null;
    }
    throw response.error;
  }
  return response.data.body;
}

async function getCalendarTimeZone({
  auth,
  calendarId,
}: {
  auth: GoogleCalendarAuthValue;
  calendarId: string;
}): Promise<string | undefined> {
  const token = await getAccessToken(auth);
  const response = await httpClient.sendRequest<{ timeZone?: string }>({
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
      calendarId
    )}`,
    queryParams: { fields: 'timeZone' },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.body.timeZone;
}

function isAllDay({ event }: { event: GoogleCalendarEvent }): boolean {
  return isNil(event.start?.dateTime) && !isNil(event.start?.date);
}

function boundaryMs({
  event,
  anchor,
  timeZone,
}: {
  event: GoogleCalendarEvent;
  anchor: 'start' | 'end';
  timeZone: string | undefined;
}): number | null {
  const boundary = anchor === 'start' ? event.start : event.end;
  if (!isNil(boundary?.dateTime)) {
    const ms = Date.parse(String(boundary.dateTime));
    return Number.isNaN(ms) ? null : ms;
  }
  if (isNil(boundary?.date)) {
    return null;
  }
  const day = String(boundary.date);
  const zonedMs = isNil(timeZone) ? null : zonedMidnightMs({ day, timeZone });
  if (!isNil(zonedMs)) {
    return zonedMs;
  }
  console.warn(
    `[google-calendar] calendar time zone ${
      timeZone ?? 'missing'
    } could not be used; reading the all-day date ${day} in UTC.`
  );
  const utcMs = dayjs.utc(day).valueOf();
  return Number.isNaN(utcMs) ? null : utcMs;
}

function zonedMidnightMs({
  day,
  timeZone,
}: {
  day: string;
  timeZone: string;
}): number | null {
  try {
    const ms = dayjs.tz(day, timeZone).valueOf();
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

function buildRangeRequest({
  calendarId,
  token,
  timeMinMs,
  timeMaxMs,
  pageToken,
}: {
  calendarId: string;
  token: string;
  timeMinMs: number;
  timeMaxMs: number;
  pageToken: string | undefined;
}): HttpRequest {
  return {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams: {
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: new Date(timeMinMs).toISOString(),
      timeMax: new Date(timeMaxMs).toISOString(),
      maxResults: PAGE_SIZE,
      ...(pageToken ? { pageToken } : {}),
    },
    timeout: REQUEST_TIMEOUT_MS,
  };
}

export const rangeEvents = {
  listEventsInRange,
  listUpcomingOrRecent,
  getEventOrNull,
  getCalendarTimeZone,
  isAllDay,
  boundaryMs,
};

export type RangeListing = {
  events: GoogleCalendarEvent[];
  timeZone: string | undefined;
  complete: boolean;
  nextPageToken?: string;
};

type RangePage = {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  timeZone?: string;
};
