import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeleteEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_delete_event',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Delete Event',
  description: 'Deletes a calendar event, moving it to Deleted Items.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes an event by its ID (from List Events, Get Calendar View or Create Event), moving it to the Deleted Items folder where it can still be recovered. If the signed-in user organizes a meeting with attendees, they receive a cancellation. Use Permanently Delete Event to remove it beyond recovery.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}`)
      .delete();
    return { success: true };
  },
});
