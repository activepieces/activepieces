import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarEventListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListEventsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_events',
  outputSchema: outlookCalendarEventListOutputSchema,
  displayName: 'List Events',
  description: 'Lists events in the mailbox or in one calendar.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists event records (single events and recurring series masters, not expanded occurrences) across the signed-in user's default calendar, or in one calendar when Calendar ID is set. Narrow with an OData $filter and sort with $orderby; use Get Calendar View instead to get every occurrence inside a date range. Returns @odata.nextLink when more pages exist; pass it as Page URL together with the same Output Time Zone, because the link does not carry it.",
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({
      required: false,
      description: "Calendar ID, from List Calendars. Leave empty for the user's default calendar.",
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description:
        'OData $filter expression, e.g. "start/dateTime ge \'2026-11-01T00:00:00\'" or "contains(subject,\'review\')". Dates in the filter are read in the Output Time Zone when it is set, else in UTC.',
      required: false,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By',
      description: 'OData $orderby expression, e.g. "start/dateTime desc".',
      required: false,
    }),
    select: Property.ShortText({
      displayName: 'Select',
      description:
        'Comma-separated event properties to return, e.g. "subject,start,end,organizer". Leave empty for all properties.',
      required: false,
    }),
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
    timeZone: outlookCalendarAiProps.timeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { calendarId, filter, orderBy, select } = propsValue;
    const response: OutlookCalendarPage<Event> = await outlookCalendarClient
      .list({
        auth,
        path: calendarId ? `/me/calendars/${encodeURIComponent(calendarId)}/events` : '/me/events',
        query: {
          $top: outlookCalendarUtils.top({ limit: propsValue.limit }),
          ...(filter ? { $filter: filter } : {}),
          ...(orderBy ? { $orderby: orderBy } : {}),
          ...(select ? { $select: select } : {}),
        },
        pageUrl: propsValue.pageUrl,
      })
      .headers(
        outlookCalendarUtils.preferTimeZone({
          timeZone: propsValue.timeZone,
        }),
      )
      .get();
    return response;
  },
});
