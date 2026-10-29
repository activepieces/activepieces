import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarPermanentlyDeleteEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_permanently_delete_event',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Permanently Delete Event',
  description: 'Permanently deletes a calendar event so it cannot be recovered.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an event by its ID (from List Events, Get Calendar View or Create Event); unlike Delete Event it skips Deleted Items and cannot be undone. If the signed-in user organizes a meeting with attendees, they receive a cancellation.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}/permanentDelete`)
      .post({});
    return { success: true };
  },
});
