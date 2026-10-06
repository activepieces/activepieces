import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioCreateCommentOutputSchema } from '../../output-schemas';

export const attioGetCommentAction = createAction({
	auth: attioAuth,
	name: 'attio_get_comment',
	outputSchema: attioCreateCommentOutputSchema,
	displayName: 'Get Comment',
	description: 'Gets a comment by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment by ID, with its thread, author and the record or entry it is on.',
		idempotent: true,
	},
	props: {
		comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'From List Threads or Create Comment.', required: true }),
	},
	async run(context) {
		const { comment_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/comments/${comment_id}`,
		});
		return response.data;
	},
});
