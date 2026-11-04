import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Attachment, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarAttachmentListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListEventAttachmentsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_event_attachments',
  outputSchema: outlookCalendarAttachmentListOutputSchema,
  displayName: 'List Event Attachments',
  description: 'Lists the attachments of an event.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the attachments of one event with their ID, name, content type, size and inline flag, without the file content. Use it to find the attachment ID that Get Event Attachment and Delete Event Attachment take; Get Event Attachment returns the content.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: OutlookCalendarPage<Attachment> = await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}/attachments`)
      .query({ $select: 'id,name,contentType,size,isInline,lastModifiedDateTime' })
      .get();
    return response;
  },
});
