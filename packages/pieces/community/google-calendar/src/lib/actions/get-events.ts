import { ActionContext, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarAuth, googleCalendarCommon, getAccessToken } from '../common';
import dayjs from 'dayjs';

import { getEventsActionOutputSchema } from '../output-schemas';
export const getEventsProps = {
  calendar_id: googleCalendarCommon.calendarDropdown('writer'),
  event_types: Property.StaticMultiSelectDropdown({
    displayName: 'Event Types',
    description: 'Only events of these types are returned.',
    required: false,
    defaultValue: ['default', 'focusTime', 'outOfOffice'],
    advanced: true,
    options: {
      options: [
        {
          label: 'Default',
          value: 'default',
        },
        {
          label: 'Out of Office',
          value: 'outOfOffice',
        },
        {
          label: 'Focus Time',
          value: 'focusTime',
        },
        {
          label: 'Working Location',
          value: 'workingLocation',
        },
      ],
    },
  }),
  search: Property.ShortText({
    displayName: 'Search Term',
    description: 'Matches title, description, location and guests.',
    required: false,
  }),
  start_date: Property.DateTime({
    displayName: 'Start Time',
    description: 'Only events that end after this time.',
    required: false,
  }),
  end_date: Property.DateTime({
    displayName: 'End Time',
    description: 'Only events starting before this. Requires Start Time.',
    required: false,
  }),
  singleEvents: Property.Checkbox({
    displayName: 'Expand Recurring Events',
    description: 'Returns each occurrence of a recurring event separately.',
    required: false,
    defaultValue: false,
  }),
};

export async function runGetEvents(
  context: ActionContext<typeof googleCalendarAuth, typeof getEventsProps>
) {
  // docs: https://developers.google.com/calendar/api/v3/reference/events/list
  const {
    calendar_id: calendarId,
    start_date,
    end_date,
    search,
    event_types,
    singleEvents,
  } = context.propsValue;
  const token = await getAccessToken(context.auth);
  const queryParams: Record<string, string> = { showDeleted: 'false' };
  let url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`;

  if (singleEvents !== null) {
    queryParams['singleEvents'] = singleEvents ? 'true' : 'false';
  }

  if (search) {
    queryParams['q'] = `"${search}"`;
  }

  // date range
  if (start_date) {
    queryParams['timeMin'] = dayjs(start_date).format(
      'YYYY-MM-DDTHH:mm:ss.sssZ'
    );
  }
  if (start_date && end_date) {
    queryParams['timeMax'] = dayjs(end_date).format(
      'YYYY-MM-DDTHH:mm:ss.sssZ'
    );
  }
  // filter by event type
  const eventTypes = event_types ?? [];
  if (eventTypes.length > 0) {
    url += `?${eventTypes.map((type) => `eventTypes=${type}`).join('&')}`;
  }
  const request: HttpRequest<Record<string, unknown>> = {
    method: HttpMethod.GET,
    url,
    queryParams,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  };
  return await httpClient.sendRequest(request);
}

export const getEvents = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_events',
  classification: 'SEARCH',
  description: 'Lists events in a calendar, with optional filters.',
  audience: 'human',
  aiMetadata: { description: 'Lists events from a Google Calendar, optionally filtered by a date range, search term, and event types, and can expand recurring events into individual instances. Use to look up or browse multiple events when you do not already have a specific event ID; use Get Event by ID for a single known event. Read-only and idempotent.', idempotent: true },
  displayName: 'Get Events',
  props: getEventsProps,
  outputSchema: getEventsActionOutputSchema,
  run: runGetEvents,
});

