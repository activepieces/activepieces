import { createAction, Property } from '@activepieces/pieces-framework';
import { outlookCalendarAuth } from '../auth';
import { outlookCalendarClient } from '../common/client';
import { outlookCalendarProps } from '../common/props';

import type { Event, OutlookCalendarPage } from '../common/types';
import { outlookCalendarCalendarEventListOutputSchema } from '../output-schemas';

export const listEventsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'list_events',
  outputSchema: outlookCalendarCalendarEventListOutputSchema,
  classification: 'SEARCH',
  description: 'List events in a calendar',
  audience: 'human',
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

    const response: OutlookCalendarPage<Event> = await outlookCalendarClient
      .list({
        auth,
        path: `/me/calendars/${propsValue.calendarId}/events`,
        query: queryParams,
        pageUrl: undefined,
      })
      .get();
    return response;
  },
});
