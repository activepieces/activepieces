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

export const createEvent = createAction({
  auth: googleCalendarAuth,
  name: 'create_google_calendar_event',
  description: 'Add Event',
  displayName: 'Create Event',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    title: Property.ShortText({
      displayName: 'Title of the event',
      required: true,
    }),
    start_date_time: Property.DateTime({
      displayName: 'Start date time of the event',
      required: true,
    }),
    end_date_time: Property.DateTime({
      displayName: 'End date time of the event',
      description: "By default it'll be 30 min post start time",
      required: false,
    }),
  },
  async run(configValue) {
    // docs: https://developers.google.com/calendar/api/v3/reference/events/insert
    const {
      calendar_id: calendarId,
      title: summary,
      start_date_time,
      end_date_time,
    } = configValue.propsValue;
    const { access_token: token } = configValue.auth;
    const start = {
      dateTime: dayjs(start_date_time).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    };
    const endTime = end_date_time
      ? end_date_time
      : dayjs(start_date_time).add(30, 'm');
    const end = {
      dateTime: dayjs(endTime).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    };
    const url = `${googleCalendarCommon.baseUrl}/calendars/${calendarId}/events`;
    const request: HttpRequest<Record<string, unknown>> = {
      method: HttpMethod.POST,
      url,
      body: {
        summary,
        start,
        end,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };
    return await httpClient.sendRequest(request);
  },
});
