import { randomUUID } from 'crypto';
import { googleCalendarCommon } from './index';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
import { OAuth2PropertyValue } from '../../../framework/property';
import {
  CalendarList,
  CalendarObject,
  GoogleCalendarEvent,
  GoogleCalendarEventList,
  GoogleWatchResponse,
  GoogleWatchType,
} from './types';
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';

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
  await httpClient.sendRequest(request);
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
  authProp: OAuth2PropertyValue
): Promise<CalendarObject[]> {
  // docs: https://developers.google.com/calendar/api/v3/reference/calendarList/list
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${googleCalendarCommon.baseUrl}/users/me/calendarList`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProp.access_token,
    },
  };
  const response = await httpClient.sendRequest<CalendarList>(request);
  return response.body.items;
}

export async function getLatestEvent(
  calendarId: string,
  authProp: OAuth2PropertyValue
): Promise<GoogleCalendarEvent> {
  // docs: https://developers.google.com/calendar/api/v3/reference/events/list
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const qParams: Record<string, string> = {
    updatedMin: yesterday.toISOString(),
    maxResults: '2500', // Modified
    orderBy: 'updated',
    singleEvents: 'true',
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
  const lastUpdatedEvent = eventList.pop()!; // You can retrieve the last updated event.
  return lastUpdatedEvent;
}
