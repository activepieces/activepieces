import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';

import { deleteAttachmentOutputSchema } from '../../output-schemas';
export const deleteAttachmentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'delete_attachment',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Attachment',
	description: 'Permanently deletes an attachment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete an attachment from its issue by attachment ID. This cannot be undone, so confirm with the user first. Attachment IDs are in the attachment field of Fetch Issue. Not idempotent: a retry returns not found.',
		idempotent: false,
	},
	outputSchema: deleteAttachmentOutputSchema,
	props: {
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'The numeric attachment ID, from the attachment field of Fetch Issue.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const attachmentId = propsValue.attachmentId.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.DELETE,
			resourceUri: `/attachment/${encodeURIComponent(attachmentId)}`,
		});
		return { success: true, attachment_id: attachmentId, deleted: true };
	},
});
