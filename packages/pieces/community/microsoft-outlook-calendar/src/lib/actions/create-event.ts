import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { outlookCalendarAuth } from '../..';
import { outlookCalendarCommon } from '../common/common';
import dayjs from 'dayjs';

export const createEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'create_event',
  description: 'Create a new event in a calendar',
  displayName: 'Create a new event in a calendar',
  props: {
    calendarId: outlookCalendarCommon.calendarDropdown,
    title: Property.ShortText({
      displayName: 'Title of the event',
      required: true,
    }),
    start: Property.DateTime({
      displayName: 'Start date time of the event',
      required: true,
    }),
    end: Property.DateTime({
      displayName: 'End date time of the event',
      description: "By default it'll be 30 min post start time",
      required: false,
    }),
    timezone: outlookCalendarCommon.timezoneDropdown,
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const startDateTime = dayjs(propsValue.start).format('YYYY-MM-DDTHH:mm:ss');
    const endTime = propsValue.end
      ? propsValue.end
      : dayjs(startDateTime).add(30, 'm');
    const endDateTime = dayjs(endTime).format('YYYY-MM-DDTHH:mm:ss');

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${outlookCalendarCommon.baseUrl}/calendars/${propsValue.calendarId}/events`,
      body: {
        subject: propsValue.title,
        body: {},
        start: {
          dateTime: startDateTime,
          timeZone: propsValue.timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: propsValue.timezone,
        },
        location: {
          displayName: propsValue.location,
        },
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
