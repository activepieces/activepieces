import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarSnoozeReminderAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_snooze_reminder',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Snooze Reminder',
  description: 'Postpones the reminder of an event to a new time.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Postpones the reminder of an event in the signed-in user's calendar until the given time. The new time must be later than the current reminder time; an earlier one is accepted but ignored. Takes the event ID from List Reminders, List Events or Get Calendar View; use Dismiss Reminder to stop it instead.",
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    newReminderTime: Property.ShortText({
      displayName: 'New Reminder Time',
      description:
        'When the reminder should fire again, ISO 8601 without offset, e.g. "2026-11-03T14:45:00".',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'Time zone of New Reminder Time, IANA or Windows name (see Get Supported Time Zones). Defaults to UTC.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { eventId, newReminderTime, timeZone } = propsValue;
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(eventId)}/snoozeReminder`)
      .post({ newReminderTime: { dateTime: newReminderTime, timeZone: timeZone ?? 'UTC' } });
    return { success: true };
  },
});
