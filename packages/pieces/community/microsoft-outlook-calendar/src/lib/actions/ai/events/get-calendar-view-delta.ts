import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarEventDeltaOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetCalendarViewDeltaAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_calendar_view_delta',
  outputSchema: outlookCalendarEventDeltaOutputSchema,
  displayName: 'Get Calendar View Delta',
  description: 'Syncs the events in a date range: added, changed and deleted since the last sync.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Incrementally syncs the events in a date range. The first call takes Start and End and returns every event in the range; keep passing @odata.nextLink as Page URL until the response carries @odata.deltaLink instead, then store that deltaLink and later pass it as Page URL to get only events added, changed or deleted (marked "@removed") since then. Start and End are only needed on the first call.',
    idempotent: true,
  },
  props: {
    startDateTime: Property.ShortText({
      displayName: 'Start',
      description:
        'Start of the range as ISO 8601, e.g. "2026-11-01T00:00:00Z". Required unless Page URL is set.',
      required: false,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End',
      description:
        'End of the range as ISO 8601, e.g. "2026-12-01T00:00:00Z". Required unless Page URL is set.',
      required: false,
    }),
    calendarId: outlookCalendarAiProps.calendarId({
      required: false,
      description: "Calendar ID, from List Calendars. Leave empty for the user's default calendar.",
    }),
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({
      required: false,
      description:
        'The @odata.nextLink or @odata.deltaLink from a previous call of this action. When set, Start, End and Calendar ID are ignored because the link already carries them.',
    }),
    timeZone: outlookCalendarAiProps.timeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { startDateTime, endDateTime, calendarId, pageUrl } = propsValue;
    if (!pageUrl && (!startDateTime || !endDateTime)) {
      throw new Error('Start and End are required unless Page URL is set.');
    }
    const prefer = [
      `odata.maxpagesize=${outlookCalendarUtils.top({ limit: propsValue.limit })}`,
      outlookCalendarUtils.preferTimeZone({ timeZone: propsValue.timeZone })?.['Prefer'],
    ]
      .filter(Boolean)
      .join(', ');
    const response: OutlookCalendarPage<Event> = await outlookCalendarClient
      .list({
        auth,
        path: calendarId
          ? `/me/calendars/${encodeURIComponent(calendarId)}/calendarView/delta`
          : '/me/calendarView/delta',
        query: startDateTime && endDateTime ? { startDateTime, endDateTime } : undefined,
        pageUrl: pageUrl,
      })
      .headers({ Prefer: prefer })
      .get();
    return response;
  },
});
