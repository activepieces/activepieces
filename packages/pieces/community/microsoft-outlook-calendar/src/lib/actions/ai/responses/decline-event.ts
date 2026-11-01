import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeclineEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_decline_event',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Decline Event',
  description: "Declines a meeting invitation in the signed-in user's calendar.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Declines a meeting the signed-in user was invited to, optionally with a comment and a proposed new time, and by default notifies the organizer (Send Response must stay on when a Comment is given); the event then moves to Deleted Items. Takes the event ID from List Events or Get Calendar View. Proposed New Start and End go together, only work when the organizer allows new time proposals, and need Send Response left on; a repeat may fail once the event is removed.',
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
    proposedStart: outlookCalendarAiProps.proposedStart({ required: false }),
    proposedEnd: outlookCalendarAiProps.proposedEnd({ required: false }),
    proposedTimeZone: outlookCalendarAiProps.proposedTimeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { eventId, comment, sendResponse, proposedStart, proposedEnd } = propsValue;
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(eventId)}/decline`)
      .post({
        ...(comment !== undefined ? { comment } : {}),
        ...(sendResponse !== undefined ? { sendResponse: sendResponse === 'true' } : {}),
        ...outlookCalendarUtils.proposedNewTime({
          start: proposedStart,
          end: proposedEnd,
          timeZone: propsValue.proposedTimeZone,
        }),
      });
    return { success: true };
  },
});
