import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetAttachmentOutputSchema } from '../../../output-schemas';

export const zendeskGetAttachment = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_attachment',
  outputSchema: zendeskGetAttachmentOutputSchema,
  displayName: 'Get Attachment',
  description: 'Get an attachment, including its download URL.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one attachment by ID, with file name, content type, size, malware scan result and content_url to download it. Attachment IDs come from the attachments of List Ticket Comments.',
    idempotent: true,
  },
  props: {
    attachment_id: zendeskAiProps.requiredId({ displayName: 'Attachment ID', description: 'Numeric attachment ID, from List Ticket Comments.' }),
  },
  async run({ auth, propsValue }) {
    const attachmentId = zendeskApi.id({ value: propsValue.attachment_id, label: 'Attachment ID' });
    const response = await zendeskApi.request<{ attachment: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/attachments/${attachmentId}.json`,
    });
    return response.attachment;
  },
});
