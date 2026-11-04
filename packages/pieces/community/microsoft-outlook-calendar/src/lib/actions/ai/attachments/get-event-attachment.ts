import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Attachment } from '../../../common/types';
import { outlookCalendarAttachmentOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetEventAttachmentAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_event_attachment',
  outputSchema: outlookCalendarAttachmentOutputSchema,
  displayName: 'Get Event Attachment',
  description: 'Gets one attachment of an event, including its content.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one attachment of an event by ID, including its name, content type, size and, for file attachments, the base64 content in contentBytes. The attachment ID comes from List Event Attachments or Add Event Attachment.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    attachmentId: outlookCalendarAiProps.attachmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: Attachment = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/events/${encodeURIComponent(propsValue.eventId)}/attachments/${encodeURIComponent(
          propsValue.attachmentId,
        )}`,
      )
      .get();
    return response;
  },
});
