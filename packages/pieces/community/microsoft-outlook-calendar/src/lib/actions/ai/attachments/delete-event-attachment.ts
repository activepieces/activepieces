import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeleteEventAttachmentAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_delete_event_attachment',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Delete Event Attachment',
  description: 'Permanently removes an attachment from an event.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one attachment from an event; it cannot be recovered. Deleting an attachment that is already gone also succeeds. The attachment ID comes from List Event Attachments or Add Event Attachment.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    attachmentId: outlookCalendarAiProps.attachmentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/events/${encodeURIComponent(propsValue.eventId)}/attachments/${encodeURIComponent(
          propsValue.attachmentId,
        )}`,
      )
      .delete();
    return { success: true };
  },
});
