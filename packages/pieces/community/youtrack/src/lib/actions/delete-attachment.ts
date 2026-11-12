import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { deleteAttachmentActionOutputSchema } from '../output-schemas';

export const deleteAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'delete_attachment',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteAttachmentActionOutputSchema,
  displayName: 'Delete Attachment',
  description: 'Deletes an attachment from an issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete a single attachment from an issue, given the issue ID and the attachment database ID (e.g. "134-31", found via List Attachments). Not idempotent: a second call fails with HTTP 404 because the attachment no longer exists.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description: 'The database ID of the attachment (e.g. "134-31"). Use the "List Attachments" action to find it.',
      required: true,
    }),
  },
  async run(context) {
    const issueId = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const attachmentId = youtrackClient.segment({ value: context.propsValue.attachmentId, label: 'Attachment ID' });
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/issues/${issueId}/attachments/${attachmentId}`,
      operation: 'delete the attachment',
    });
    return { success: true, issue_id: context.propsValue.issue, attachment_id: context.propsValue.attachmentId };
  },
});
