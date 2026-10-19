import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listEmailAttachmentsOutputSchema } from '../output-schemas';

export const listEmailAttachments = createAction({
  name: 'list_email_attachments',
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Email Attachments',
  outputSchema: listEmailAttachmentsOutputSchema,
  description: 'Retrieve all attachments on a sent email',
  audience: 'ai',
  aiMetadata: { description: "Retrieves every attachment on a previously sent email, identified by email ID, including each one's filename, size, and a time-limited download URL. Read-only and idempotent.", idempotent: true },
  props: {
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description: 'The ID of the sent email. Obtain from Get Email Status or List Sent Emails.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await resendClient.sendRequest<{
      data: {
        id: string;
        filename: string;
        size: number;
        content_type: string;
        download_url: string;
        expires_at: string;
      }[];
    }>({ auth: auth.secret_text, method: HttpMethod.GET, path: `/emails/${propsValue.email_id}/attachments` });
    return response.data;
  },
});
