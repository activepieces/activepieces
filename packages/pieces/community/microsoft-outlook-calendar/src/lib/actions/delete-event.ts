import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { outlookCalendarAuth } from '../..';
import { outlookCalendarCommon } from '../common/common';

export const deleteEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'delete_event',
  description: 'Delete an event in a calendar',
  displayName: 'Delete an event in a calendar',
  props: {
    calendarId: outlookCalendarCommon.calendarDropdown,
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${outlookCalendarCommon.baseUrl}/calendars/${propsValue.calendarId}/events/${propsValue.eventId}`,
      body: {},
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
