import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarForwardEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_forward_event',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Forward Event',
  description: 'Forwards a meeting request to other recipients.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Forwards a meeting request to the given email addresses with an optional comment; an attendee forwarding notifies the organizer, who decides whether to add the new recipients. Takes the event ID from List Events or Get Calendar View. Each call sends a new message.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    toRecipients: Property.Array({
      displayName: 'To Recipients',
      description: 'Email addresses to forward the meeting request to.',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Message included with the forwarded request.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { eventId, toRecipients, comment } = propsValue;
    if (
      toRecipients.length === 0 ||
      !toRecipients.every(
        (address): address is string => typeof address === 'string' && address !== '',
      )
    ) {
      throw new Error('To Recipients must be a non-empty list of email addresses.');
    }
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(eventId)}/forward`)
      .post({
        toRecipients: toRecipients.map((address) => ({ emailAddress: { address } })),
        ...(comment !== undefined ? { comment } : {}),
      });
    return { success: true };
  },
});
