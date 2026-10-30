import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteAttachmentOutputSchema } from '../../output-schemas';

export const asanaDeleteAttachmentAction = createAction({
  auth: asanaAuth,
  name: 'delete_attachment',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Attachment',
  description: 'Permanently delete an attachment from Asana.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one attachment from its task, project or project brief; the file cannot be restored through the API. Confirm the gid with Get Attachment or List Attachments first. Not idempotent: repeating the call on the same attachment fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteAttachmentOutputSchema,
  props: {
    attachment: Property.ShortText({
      displayName: 'Attachment GID',
      description: 'Gid of the attachment to delete. Obtain it from List Attachments.',
      required: true,
    }),
  },
  async run(context) {
    const attachment = context.propsValue.attachment.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/attachments/${asanaUtils.pathSegment(attachment)}`,
      operation: 'Delete Attachment',
    });
    return { success: true, attachment_gid: attachment };
  },
});
