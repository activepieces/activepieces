import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { randomUUID } from 'crypto';
import { googleCalendarCommon } from '.';
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
  authProp: OAuth2PropertyValue
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
      token: authProp.access_token,
    },
  };
  await httpClient.sendRequest<any>(request);
}

export async function watchEvent(
  calendarId: string,
  webhookUrl: string,
  authProp: OAuth2PropertyValue
): Promise<GoogleWatchResponse> {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events/watch`,
    body: {
      id: randomUUID(),
      type: GoogleWatchType.WEBHOOK,
      address: webhookUrl,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
  };
  const { body: webhook } = await httpClient.sendRequest<GoogleWatchResponse>(
    request
  );
  return webhook;
}

export async function getCalendars(
  authProp: OAuth2PropertyValue,
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
      token: authProp.access_token,
    },
  };
  const response = await httpClient.sendRequest<CalendarList>(request);
  return response.body.items;
}

export async function getColors(
  authProp: OAuth2PropertyValue
): Promise<GetColorsResponse> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/colors`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
  };
  const response = await httpClient.sendRequest<GetColorsResponse>(request);
  return response.body;
}

export async function getEvents(
  calendarId: string,
  expandRecurringEvent: boolean,
  authProp: OAuth2PropertyValue,
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

  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`,
    queryParams: qParams,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
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
  authProp: OAuth2PropertyValue
): Promise<GoogleCalendarEvent> {
  const eventList = await getEvents(calendarId, false, authProp);
  const lastUpdatedEvent = eventList.pop()!; // You can retrieve the last updated event.
  return lastUpdatedEvent;
}

export async function getEventsForDropdown(
  authProp: OAuth2PropertyValue,
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
        token: authProp.access_token,
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
