import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { outlookCalendarAuth } from '../..';
import { outlookCalendarCommon } from '../common/common';

export const listEventsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'list_events',
  description: 'List events in a calendar',
  displayName: 'List events in a calendar',
  props: {
    calendarId: outlookCalendarCommon.calendarDropdown,
    filter: Property.LongText({
      displayName: 'Filter',
      required: false,
      description:
        'Search query filter, see: https://learn.microsoft.com/en-us/graph/filter-query-parameter',
    }),
  },
  async run({ propsValue, auth }) {
    const queryParams: Record<string, string> = {};

    if (propsValue.filter) queryParams['$filter'] = propsValue.filter;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${outlookCalendarCommon.baseUrl}/calendars/${propsValue.calendarId}/events`,
      queryParams,
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
