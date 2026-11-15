import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { getEmailAttachmentOutputSchema } from '../output-schemas';

export const getEmailAttachment = createAction({
  name: 'get_email_attachment',
  classification: 'READ',
  auth: resendAuth,
  displayName: 'Get Email Attachment',
  outputSchema: getEmailAttachmentOutputSchema,
  description: 'Retrieve a single attachment from a sent email',
  audience: 'ai',
  aiMetadata: { description: 'Retrieves metadata and a download URL for a single attachment on a previously sent email, identified by email ID and attachment ID. Use List Email Attachments to find the attachment ID. Read-only and idempotent; the download URL expires after a limited time.', idempotent: true },
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the sent email. Obtain from Get Email Status or List Sent Emails.',
      required: true,
    }),
    attachment_id: Property.ShortText({ displayName: 'Attachment ID', required: true }),
  },
  async run({ auth, propsValue }) {
    return await resendClient.sendRequest({ auth: auth.secret_text, method: HttpMethod.GET, path: `/emails/${propsValue.email_id}/attachments/${propsValue.attachment_id}` });
  },
});
