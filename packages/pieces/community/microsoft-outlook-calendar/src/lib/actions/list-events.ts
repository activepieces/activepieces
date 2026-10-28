import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { outlookCalendarAuth } from '../auth';
import { outlookCalendarClient } from '../common/client';
import { outlookCalendarProps } from '../common/props';

export const listEventsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'list_events',
  classification: 'SEARCH',
  description: 'List events in a calendar',
  audience: 'both',
  aiMetadata: { description: 'Retrieves events from a specified Microsoft Outlook calendar. Leave the filter empty to fetch all events, or supply an OData $filter expression to narrow results to matching events. Use to look up or browse existing events. Read-only and idempotent.', idempotent: true },
  displayName: 'List events in a calendar',
  props: {
    calendarId: outlookCalendarProps.calendarId({ required: true }),
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

    return await outlookCalendarClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/calendars/${propsValue.calendarId}/events`,
      query: queryParams,
      body: {},
    });
  },
});
