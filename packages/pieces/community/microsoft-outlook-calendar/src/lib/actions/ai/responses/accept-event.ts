import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarAcceptEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_accept_event',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Accept Event',
  description: "Accepts a meeting invitation in the signed-in user's calendar.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Accepts a meeting the signed-in user was invited to, optionally with a comment, and by default notifies the organizer; Send Response must stay on when a Comment is given. Takes the event ID from List Events or Get Calendar View; use Tentatively Accept Event or Decline Event for the other answers. Repeating it re-sends the response.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Text included in the response to the organizer.',
      required: false,
    }),
    sendResponse: outlookCalendarAiProps.sendResponse({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { eventId, comment, sendResponse } = propsValue;
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(eventId)}/accept`)
      .post({
        ...(comment !== undefined ? { comment } : {}),
        ...(sendResponse !== undefined ? { sendResponse: sendResponse === 'true' } : {}),
      });
    return { success: true };
  },
});
