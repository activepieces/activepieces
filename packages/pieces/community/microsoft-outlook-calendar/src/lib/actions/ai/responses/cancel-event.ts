import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarCancelEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_cancel_event',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Cancel Event',
  description: 'Cancels a meeting the signed-in user organizes and notifies the attendees.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Cancels a meeting the signed-in user organizes, sends a cancellation with the optional comment to every attendee, and removes the event. Only the organizer can cancel; an attendee uses Decline Event. Delete Event also sends the attendees a cancellation, but without a comment. Takes the event ID from List Events or Get Calendar View.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Message sent to the attendees with the cancellation.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { eventId, comment } = propsValue;
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(eventId)}/cancel`)
      .post(comment !== undefined ? { comment } : {});
    return { success: true };
  },
});
