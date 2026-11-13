import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDismissReminderAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_dismiss_reminder',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Dismiss Reminder',
  description: 'Dismisses the reminder of an event.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Dismisses the reminder of an event in the signed-in user's calendar so it stops firing. Takes the event ID from List Reminders, List Events or Get Calendar View; use Snooze Reminder to postpone it instead.",
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}/dismissReminder`)
      .post({});
    return { success: true };
  },
});
