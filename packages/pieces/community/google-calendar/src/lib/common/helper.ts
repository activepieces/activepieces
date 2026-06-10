import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';
import { googleCalendarCommon, GoogleCalendarAuthValue, getAccessToken } from '.';
import {
  GoogleWatchResponse,
  GoogleWatchType,
  CalendarObject,
  CalendarList,
  GoogleCalendarEvent,
  GoogleCalendarEventList,
  GetColorsResponse,
} from './types';

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
  await httpClient.sendRequest<any>(request);
}

export async function watchEvent(
  calendarId: string,
  webhookUrl: string,
  authProp: GoogleCalendarAuthValue
): Promise<GoogleWatchResponse> {
  const sixDaysFromNowMs = Date.now() + 6 * 24 * 60 * 60 * 1000;
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events/watch`,
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
}: {
  calendarId: string;
  authProp: GoogleCalendarAuthValue;
}): Promise<string | undefined> {
  const accessToken = await getAccessToken(authProp);
  const qParams: Record<string, string> = {
    singleEvents: 'true',
    showDeleted: 'true',
    maxResults: '2500',
  };
  let pageToken = '';
  let nextSyncToken: string | undefined;
  do {
    if (pageToken) {
      qParams['pageToken'] = pageToken;
    }
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`,
      queryParams: qParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    const { body: res } = await httpClient.sendRequest<GoogleCalendarEventList>(
      request
    );
    pageToken = res.nextPageToken;
    nextSyncToken = res.nextSyncToken;
  } while (pageToken);
  return nextSyncToken;
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
    syncToken,
    maxResults: '2500',
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
      url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`,
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
  minAccessRole?: 'writer'
): Promise<CalendarObject[]> {
  // docs: https://developers.google.com/calendar/api/v3/reference/calendarList/list
  const queryParams: Record<string, string> = {
    showDeleted: 'false',
  };
  if (minAccessRole) {
    queryParams['minAccessRole'] = minAccessRole;
  }
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/users/me/calendarList`,
    queryParams: queryParams,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: await getAccessToken(authProp),
    },
  };
  const response = await httpClient.sendRequest<CalendarList>(request);
  return response.body.items;
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

export async function getEvents(
  calendarId: string,
  expandRecurringEvent: boolean,
  authProp: GoogleCalendarAuthValue,
  minUpdated?: Date
): Promise<GoogleCalendarEvent[]> {
  // docs: https://developers.google.com/calendar/api/v3/reference/events/list
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const qParams: Record<string, string> = {
    updatedMin: minUpdated?.toISOString() ?? yesterday.toISOString(),
    maxResults: '2500', // Modified
    orderBy: 'updated',
    singleEvents: expandRecurringEvent ? 'true' : 'false',
    showDeleted: 'true',
  };

  const accessToken = await getAccessToken(authProp);
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`,
    queryParams: qParams,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  };

  let eventList: GoogleCalendarEvent[] = [];
  let pageToken = '';
  do {
    qParams['pageToken'] = pageToken;
    const { body: res } = await httpClient.sendRequest<GoogleCalendarEventList>(
      request
    );
    if (res.items.length > 0) {
      eventList = [...eventList, ...res.items];
    }
    pageToken = res.nextPageToken;
  } while (pageToken);

  return eventList;
}

export async function getLatestEvent(
  calendarId: string,
  authProp: GoogleCalendarAuthValue
): Promise<GoogleCalendarEvent> {
  const eventList = await getEvents(calendarId, false, authProp);
  const lastUpdatedEvent = eventList.pop()!; // You can retrieve the last updated event.
  return lastUpdatedEvent;
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
