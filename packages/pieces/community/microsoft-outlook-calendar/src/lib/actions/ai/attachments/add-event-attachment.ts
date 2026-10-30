import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Attachment } from '../../../common/types';
import { outlookCalendarAttachmentOutputSchema } from '../../../output-schemas';

export const outlookCalendarAddEventAttachmentAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_add_event_attachment',
  outputSchema: outlookCalendarAttachmentOutputSchema,
  displayName: 'Add Event Attachment',
  description: 'Attaches a file of up to 3 MB to an event.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attaches a file to an event and returns the new attachment with its ID. The file must be 3 MB or smaller; larger files are rejected. Each call adds another attachment, even with the same file. The event ID comes from List Events or Create Event.',
    idempotent: false,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach, 3 MB or smaller.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Attachment name shown on the event. Defaults to the file name.',
      required: false,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'MIME type of the file, e.g. "application/pdf".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { file, name, contentType } = propsValue;
    if (file.data.length > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        'File is larger than 3 MB. Add Event Attachment only accepts files up to 3 MB.',
      );
    }
    const response: Attachment = await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}/attachments`)
      .post({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: name ?? file.filename,
        contentBytes: file.data.toString('base64'),
        ...(contentType !== undefined ? { contentType } : {}),
      });
    return response;
  },
});

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
