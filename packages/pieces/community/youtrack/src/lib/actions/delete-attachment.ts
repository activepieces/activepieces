import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const deleteAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'delete_attachment',
  displayName: 'Delete Attachment',
  description: 'Deletes an attachment from an issue.',
  audience: 'both',
  aiMetadata: { description: 'Delete a single attachment from an issue, given the issue ID and the attachment database ID (e.g. "134-31", found via List Attachments or Get Issue). Idempotent: deleting an already-removed attachment has no further effect.', idempotent: true },
  props: {
    issue: issueDropdown,
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description: 'The database ID of the attachment (e.g. "134-31"). You can find attachment IDs by using the "Get Issue" action — look for the attachment IDs in the output.',
      required: true,
    }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    await youtrackApiCall({
      baseUrl,
      token: apiToken,
      method: HttpMethod.DELETE,
      path: '/issues/' + context.propsValue.issue + '/attachments/' + context.propsValue.attachmentId,
    });
    return { success: true };
  },
});
