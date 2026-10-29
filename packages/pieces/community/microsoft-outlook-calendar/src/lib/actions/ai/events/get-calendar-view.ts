import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarEventListOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetCalendarViewAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_calendar_view',
  outputSchema: outlookCalendarEventListOutputSchema,
  displayName: 'Get Calendar View',
  description: 'Lists every event occurrence inside a date range.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists the events, occurrences and exceptions of recurring series that fall between Start and End, in the user's default calendar or in one calendar when Calendar ID is set. Use it to answer what is on the calendar in a period; List Events returns series masters instead of occurrences. Returns @odata.nextLink when more pages exist; pass it as Page URL.",
    idempotent: true,
  },
  props: {
    startDateTime: Property.ShortText({
      displayName: 'Start',
      description:
        'Start of the range as ISO 8601, e.g. "2026-11-01T00:00:00Z". Without an offset it is read as UTC.',
      required: true,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End',
      description:
        'End of the range as ISO 8601, e.g. "2026-11-08T00:00:00Z". Without an offset it is read as UTC.',
      required: true,
    }),
    calendarId: outlookCalendarAiProps.calendarId({
      required: false,
      description: "Calendar ID, from List Calendars. Leave empty for the user's default calendar.",
    }),
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
    timeZone: outlookCalendarAiProps.timeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { calendarId } = propsValue;
    const response: OutlookCalendarPage<Event> = await outlookCalendarClient
      .list({
        auth,
        path: calendarId
          ? `/me/calendars/${encodeURIComponent(calendarId)}/calendarView`
          : '/me/calendarView',
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
