import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon } from '../common';
import dayjs from 'dayjs';
import { googleCalendarAuth } from '../../';

export const getEvents = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_events',
  description: 'Get Events',
  displayName: 'Get all Events',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Event types',
      description: 'Select event types',
      required: true,
      defaultValue: ['default', 'focusTime', 'outOfOffice'],
      options: {
        options: [
          {
            label: 'Default',
            value: 'default',
          },
          {
            label: 'Out Of Office',
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
      required: false,
    }),
    start_date: Property.DateTime({
      displayName: 'Date from',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'Date to',
      required: false,
    }),
    singleEvents: Property.Checkbox({
			displayName: 'Expand Recurring Event?',
      description: "Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves.",
			required: true,
			defaultValue: false,
		}),
  },
  async run(configValue) {
    // docs: https://developers.google.com/calendar/api/v3/reference/events/list
    const {
      calendar_id: calendarId,
      start_date,
      end_date,
      search,
      event_types,
      singleEvents,
    } = configValue.propsValue;
    const { access_token: token } = configValue.auth;
    const queryParams: Record<string, string> = { showDeleted: 'false' };
    let url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`;

    if(singleEvents !== null) {
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
    if (event_types.length > 0) {
      url += `?${event_types.map((type) => `eventTypes=${type}`).join('&')}`;
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
  },
});
