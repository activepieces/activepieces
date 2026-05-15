// Action: Delete Attachment
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

export const deleteAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'delete_attachment',
  displayName: 'Delete Attachment',
  description: 'Deletes an attachment from an issue.',
  props: {
    issue: issueDropdown,
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description: 'The database ID of the attachment (e.g. "134-31"). You can find attachment IDs by using the "Get Issue" action — look for the attachment IDs in the output.',
      required: true,
    }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue + '/attachments/' + context.propsValue.attachmentId;
    const r = await fetch(url, {
      method: HttpMethod.DELETE,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error('Failed to delete attachment: ' + JSON.stringify(e)); }
    return { success: true };
  },
  sampleData: { success: true },
});
