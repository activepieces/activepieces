import { weblingAuth } from '../../index';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { CalendarObject, WeblingCalendarEvent, WeblingChanges } from './types';

export async function callApi<Type>(
  authProp: AppConnectionValueForAuthProperty<typeof weblingAuth>,
  request: string,
) {
  const httpRequest: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://${authProp.props.baseUrl}/api/1/${request}`,
    headers: {
      apikey: authProp.props.apikey,
    },
  };
  const response = await httpClient.sendRequest<Type>(httpRequest);
  return response;
}

export async function getChanges(
  authProp: AppConnectionValueForAuthProperty<typeof weblingAuth>,

  lastFetchEpochMS: number,
): Promise<WeblingChanges> {
  // Webling API breaks if unix timestamp is too far in the past
  if (lastFetchEpochMS === 0) {
    const today = new Date();
    const minUpdated = new Date();
    minUpdated.setDate(today.getDate() - 7);
    lastFetchEpochMS = minUpdated.getTime();
  }

  const response = await callApi<WeblingChanges>(
    authProp,
    `/changes/${lastFetchEpochMS / 1000}` // webling uses seconds instead of milliseconds
  );
  return response.body;
}

export async function getCalendars(
  authProp: AppConnectionValueForAuthProperty<typeof weblingAuth>
): Promise<CalendarObject[]> {
  const response = await callApi<CalendarObject[]>(
    authProp,
    'calendar?format=full'
  );
  return response.body;
}

export async function getAllEvents(
  authProp: AppConnectionValueForAuthProperty<typeof weblingAuth>,
  calendarId: string,
): Promise<WeblingCalendarEvent[]> {
  const response = await callApi<WeblingCalendarEvent[]>(
    authProp,
    `calendarevent?filter=$parents.$id=${calendarId}&format=full`
  );
  return response.body;
}

export async function getEventsById(
  authProp: AppConnectionValueForAuthProperty<typeof weblingAuth>,

  eventIds: string,
): Promise<WeblingCalendarEvent[]> {

  const request = `calendarevent/${eventIds}`

  const response = await callApi<WeblingCalendarEvent[]>(
    authProp,
    request
  );

  return response.body;
};

export async function getUpdatedOrNewEvents(
  authProp: AppConnectionValueForAuthProperty<typeof weblingAuth>,
  calendarId: string,
  lastFetchEpochMS: number
): Promise<WeblingCalendarEvent[]> {
  // get changes since last call
  const weblingChanges: WeblingChanges = await getChanges(
    authProp,
    lastFetchEpochMS / 1000
  );

  // this will also include ids of deleted objects
  const changedEvents: string[] = weblingChanges.objects.calendarevents ?? [];

  const deletedObjects: string[] = weblingChanges.deleted ?? [];

  // filter out already deleted objects to treat seperately
  // including a deleted event in a query list will result in a 404 response for the whole query
  const updatedOrNewEvents: string[] = changedEvents.filter(
    (event) => !deletedObjects.includes(event)
  );

  const response = await callApi<WeblingCalendarEvent[]>(
    authProp,
    `calendarevent/${updatedOrNewEvents.join(
      ','
    )}?format=full&filter=$parents.$id=${calendarId}`
  );
  return response.body;
}
