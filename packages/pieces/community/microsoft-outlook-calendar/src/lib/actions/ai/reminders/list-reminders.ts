import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { OutlookCalendarPage, Reminder } from '../../../common/types';
import { outlookCalendarReminderListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListRemindersAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_reminders',
  outputSchema: outlookCalendarReminderListOutputSchema,
  displayName: 'List Reminders',
  description: "Lists event reminders in the signed-in user's calendar between two times.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists the reminders of events in the signed-in user's calendar between a start and end time, each with its event ID, subject, start, end and fire time. Use the event ID with Snooze Reminder or Dismiss Reminder. Start and end are read in the Output Time Zone when it is set, else in UTC. Returns every reminder in the window in one response, so keep the window narrow.",
    idempotent: true,
  },
  props: {
    startDateTime: Property.ShortText({
      displayName: 'Start Date Time',
      description: 'Start of the window, ISO 8601, e.g. "2026-11-03T00:00:00".',
      required: true,
    }),
    endDateTime: Property.ShortText({
      displayName: 'End Date Time',
      description: 'End of the window, ISO 8601, e.g. "2026-11-10T00:00:00".',
      required: true,
    }),
    timeZone: outlookCalendarAiProps.timeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { startDateTime, endDateTime, timeZone } = propsValue;
    const response: OutlookCalendarPage<Reminder> = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/reminderView(StartDateTime='${encodeURIComponent(
          startDateTime,
        )}',EndDateTime='${encodeURIComponent(endDateTime)}')`,
      )
      .headers(outlookCalendarUtils.preferTimeZone({ timeZone }))
      .get();
    return response;
  },
});
