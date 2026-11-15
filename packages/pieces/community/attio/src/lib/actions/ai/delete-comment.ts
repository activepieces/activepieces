import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDeleteCommentOutputSchema } from '../../output-schemas';

export const attioDeleteCommentAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_comment',
	outputSchema: attioDeleteCommentOutputSchema,
	displayName: 'Delete Comment',
	description: 'Permanently deletes a comment.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a comment. Deleting the first comment of a thread deletes the whole thread. Cannot be undone.',
		idempotent: false,
	},
	props: {
		comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'From List Threads or Create Comment.', required: true }),
	},
	async run(context) {
		const { comment_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/comments/${comment_id}`,
		});
		return { success: true, comment_id };
	},
});
