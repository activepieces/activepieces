import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiProps } from '../../common/ai-props';

import { deleteCommentOutputSchema } from '../../output-schemas';
export const deleteCommentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'delete_comment',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Comment',
	description: 'Permanently deletes a comment from an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently delete one comment from an issue. This cannot be undone; to change the text use Update Comment instead. Comment IDs come from List Comments. Not idempotent: a retry returns not found.',
		idempotent: false,
	},
	outputSchema: deleteCommentOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'The numeric comment ID. Find it with List Comments.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		const commentId = propsValue.commentId.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.DELETE,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/comment/${encodeURIComponent(commentId)}`,
		});
		return { success: true, issue: issueIdOrKey, comment_id: commentId, deleted: true };
	},
});
