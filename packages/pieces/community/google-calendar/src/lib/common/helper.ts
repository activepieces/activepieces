import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import { googleCalendarCommon, GoogleCalendarAuthValue, getAccessToken } from '.';
import {
  GoogleWatchResponse,
  GoogleWatchType,
  CalendarObject,
  GoogleCalendarEvent,
  GoogleCalendarEventList,
  GetColorsResponse,
} from './types';

const SYNC_SERIES_PARAMS: Record<string, string> = {
  maxResults: '2500',
};
const CALENDAR_LIST_PAGE_SIZE = '250';
const REQUEST_TIMEOUT_MS = 10_000;
const SAMPLE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export async function stopWatchEvent(
  body: GoogleWatchResponse,
  authProp: GoogleCalendarAuthValue
) {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleCalendarCommon.baseUrl}/channels/stop`,
    body: {
      id: body?.id,
      resourceId: body?.resourceId,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: await getAccessToken(authProp),
    },
  };
  await httpClient.sendRequest<unknown>(request);
}

export async function watchEvent(
  calendarId: string,
  webhookUrl: string,
  authProp: GoogleCalendarAuthValue
): Promise<GoogleWatchResponse> {
  const sixDaysFromNowMs = Date.now() + 6 * 24 * 60 * 60 * 1000;
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
      calendarId
    )}/events/watch`,
    body: {
      id: randomUUID(),
      type: GoogleWatchType.WEBHOOK,
      address: webhookUrl,
      expiration: sixDaysFromNowMs.toString(),
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: await getAccessToken(authProp),
    },
  };
  const { body: webhook } = await httpClient.sendRequest<GoogleWatchResponse>(
    request
  );
  return webhook;
}

export async function getInitialSyncToken({
  calendarId,
  authProp,
  deadlineMs,
}: {
  calendarId: string;
  authProp: GoogleCalendarAuthValue;
  deadlineMs?: number;
}): Promise<string | undefined> {
  const { nextSyncToken } = await listEventsForFullSync({
    calendarId,
    authProp,
    withItems: false,
    deadlineMs,
  });
  return nextSyncToken;
}

export async function listEventsForFullSync({
  calendarId,
  authProp,
  withItems,
  keepItem,
  deadlineMs,
}: {
  calendarId: string;
  authProp: GoogleCalendarAuthValue;
  withItems: boolean;
  keepItem?: (event: GoogleCalendarEvent) => boolean;
  deadlineMs?: number;
}): Promise<{
  items: GoogleCalendarEvent[];
  nextSyncToken: string | undefined;
  complete: boolean;
}> {
  const accessToken = await getAccessToken(authProp);
  const qParams: Record<string, string> = withItems
    ? { ...SYNC_SERIES_PARAMS }
    : { ...SYNC_SERIES_PARAMS, fields: 'nextPageToken,nextSyncToken' };
  let pageToken = '';
  let nextSyncToken: string | undefined;
  const items: GoogleCalendarEvent[] = [];
  do {
    if (!isNil(deadlineMs) && deadlineMs - Date.now() < REQUEST_TIMEOUT_MS) {
      return { items, nextSyncToken: undefined, complete: false };
    }
    if (pageToken) {
      qParams['pageToken'] = pageToken;
    }
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
      queryParams: qParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      timeout: REQUEST_TIMEOUT_MS,
    };
    const { body: res } = await httpClient.sendRequest<GoogleCalendarEventList>(
      request
    );
    if (withItems) {
      const pageItems = res.items ?? [];
      items.push(
        ...(keepItem ? pageItems.filter(keepItem) : pageItems)
      );
    }
    pageToken = res.nextPageToken;
    nextSyncToken = res.nextSyncToken;
  } while (pageToken);
  return { items, nextSyncToken, complete: true };
}

export async function listEventsWithSyncToken({
  calendarId,
  syncToken,
  authProp,
}: {
  calendarId: string;
  syncToken: string;
  authProp: GoogleCalendarAuthValue;
}): Promise<{
  items: GoogleCalendarEvent[];
  nextSyncToken: string | undefined;
  syncTokenInvalid: boolean;
}> {
  const accessToken = await getAccessToken(authProp);
  const qParams: Record<string, string> = {
    ...SYNC_SERIES_PARAMS,
    syncToken,
  };
  let pageToken = '';
  let nextSyncToken: string | undefined;
  let items: GoogleCalendarEvent[] = [];
  do {
    if (pageToken) {
      qParams['pageToken'] = pageToken;
    }
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
      queryParams: qParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    try {
      const { body: res } =
        await httpClient.sendRequest<GoogleCalendarEventList>(request);
      if (res.items?.length > 0) {
        items = [...items, ...res.items];
      }
      pageToken = res.nextPageToken;
      nextSyncToken = res.nextSyncToken;
    } catch (error) {
      const status =
        (error as { response?: { status?: number } })?.response?.status;
      if (status === 410) {
        return { items: [], nextSyncToken: undefined, syncTokenInvalid: true };
      }
      throw error;
    }
  } while (pageToken);
  return { items, nextSyncToken, syncTokenInvalid: false };
}

export async function getCalendars(
  authProp: GoogleCalendarAuthValue,
  minAccessRole?: 'writer',
  options: { showHidden?: boolean } = {}
): Promise<CalendarObject[]> {
  const token = await getAccessToken(authProp);
  const calendars: CalendarObject[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const queryParams: Record<string, string> = {
      showDeleted: 'false',
      maxResults: CALENDAR_LIST_PAGE_SIZE,
    };
    if (minAccessRole) {
      queryParams['minAccessRole'] = minAccessRole;
    }
    if (options.showHidden) {
      queryParams['showHidden'] = 'true';
    }
    if (pageToken) {
      queryParams['pageToken'] = pageToken;
    }
    const response: HttpResponse<CalendarListPage> =
      await httpClient.sendRequest<CalendarListPage>({
        method: HttpMethod.GET,
        url: `${googleCalendarCommon.baseUrl}/users/me/calendarList`,
        queryParams,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token,
        },
        timeout: REQUEST_TIMEOUT_MS,
      });
    calendars.push(...(response.body.items ?? []));
    pageToken = response.body.nextPageToken;
  } while (pageToken);
  return calendars;
}

export async function getColors(
  authProp: GoogleCalendarAuthValue
): Promise<GetColorsResponse> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/colors`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: await getAccessToken(authProp),
    },
  };
  const response = await httpClient.sendRequest<GetColorsResponse>(request);
  return response.body;
}

export async function listRecentLiveEvents({
  calendarId,
  authProp,
  keep,
  limit,
}: {
  calendarId: string;
  authProp: GoogleCalendarAuthValue;
  keep: (event: GoogleCalendarEvent) => boolean;
  limit: number;
}): Promise<GoogleCalendarEvent[]> {
  const events = await listEventsUpdatedSince({
    calendarId,
    authProp,
    updatedMinMs: Date.now() - SAMPLE_LOOKBACK_MS,
  });
  return events
    .filter((event) => event.status !== 'cancelled' && keep(event))
    .sort((left, right) => updatedTimeOf(right) - updatedTimeOf(left))
    .slice(0, limit);
}

export async function getEventsForDropdown(
  authProp: GoogleCalendarAuthValue,
  calendarId?: string,
  maxResults = 50
): Promise<{ label: string; value: string }[]> {
  if (!calendarId) {
    return [];
  }

  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30);

    const queryParams: Record<string, string> = {
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      maxResults: maxResults.toString(),
      showDeleted: 'false',
    };

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
        calendarId
      )}/events`,
      queryParams: queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(authProp),
      },
    };

    const response = await httpClient.sendRequest<GoogleCalendarEventList>(
      request
    );

    if (!response.body.items || response.body.items.length === 0) {
      return [];
    }

    return response.body.items
      .map((event) => {
        const startTime = event.start?.dateTime || event.start?.date || '';
        const startDate = startTime
          ? new Date(startTime).toLocaleDateString()
          : '';
        const startTimeFormatted = startTime
          ? new Date(startTime).toLocaleTimeString()
          : '';

        let label = event.summary || 'Untitled Event';
        if (startDate) {
          label += ` (${startDate}`;
          if (event.start?.dateTime) {
            label += ` at ${startTimeFormatted}`;
          }
          label += ')';
        }

        return {
          label: label,
          value: event.id || '',
        };
      })
      .filter((item) => item.value !== '');
  } catch (error) {
    console.error('Error fetching events for dropdown:', error);
    return [];
  }
}

async function listEventsUpdatedSince({
  calendarId,
  authProp,
  updatedMinMs,
}: {
  calendarId: string;
  authProp: GoogleCalendarAuthValue;
  updatedMinMs: number;
}): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getAccessToken(authProp);
  const eventList: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined = undefined;
  do {
    const qParams: Record<string, string> = {
      updatedMin: new Date(updatedMinMs).toISOString(),
      maxResults: '2500',
      orderBy: 'updated',
      singleEvents: 'false',
      showDeleted: 'true',
    };
    if (pageToken) {
      qParams['pageToken'] = pageToken;
    }
    const response: HttpResponse<EventListPage> =
      await httpClient.sendRequest<EventListPage>({
        method: HttpMethod.GET,
        url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`,
        queryParams: qParams,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        timeout: REQUEST_TIMEOUT_MS,
      });
    eventList.push(...(response.body.items ?? []));
    pageToken = response.body.nextPageToken;
  } while (pageToken);
  return eventList;
}

function updatedTimeOf(event: GoogleCalendarEvent): number {
  const updatedMs = Date.parse(event.updated);
  return Number.isNaN(updatedMs) ? 0 : updatedMs;
}

type CalendarListPage = {
  items?: CalendarObject[];
  nextPageToken?: string;
};

type EventListPage = {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
};
