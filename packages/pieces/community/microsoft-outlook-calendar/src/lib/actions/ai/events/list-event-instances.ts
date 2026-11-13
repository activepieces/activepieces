import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarEventInstanceListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListEventInstancesAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_event_instances',
  outputSchema: outlookCalendarEventInstanceListOutputSchema,
  displayName: 'List Event Instances',
  description: 'Lists the occurrences of a recurring event inside a date range.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the occurrences and exceptions of one recurring series between Start and End. Event ID is the series master ID (an event with type "seriesMaster" from List Events, or the seriesMasterId of an occurrence from Get Calendar View). Returns @odata.nextLink when more pages exist; pass it as Page URL.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({
      required: true,
      description:
        'Series master event ID, from List Events (type "seriesMaster") or the seriesMasterId of an occurrence from Get Calendar View.',
    }),
    startDateTime: Property.ShortText({
      displayName: 'Start',
      description:
        'Start of the range as ISO 8601, e.g. "2026-11-01T00:00:00Z". Without an offset it is read as UTC.',
      required: true,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End',
      description:
        'End of the range as ISO 8601, e.g. "2026-12-01T00:00:00Z". Without an offset it is read as UTC.',
      required: true,
    }),
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
    timeZone: outlookCalendarAiProps.timeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response: OutlookCalendarPage<Event> = await outlookCalendarClient
      .list({
        auth,
        path: `/me/events/${encodeURIComponent(propsValue.eventId)}/instances`,
        query: {
          startDateTime: propsValue.startDateTime,
          endDateTime: propsValue.endDateTime,
          $top: outlookCalendarUtils.top({ limit: propsValue.limit }),
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
