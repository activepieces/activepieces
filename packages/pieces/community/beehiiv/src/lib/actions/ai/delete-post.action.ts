import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const deletePostAiAction = createAction({
	auth: beehiivAuth,
	name: 'delete_post',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Post',
	description: 'Deletes a draft post, or archives a published post.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one beehiiv post by Post ID: a draft is removed permanently, a confirmed (published or scheduled) post is archived instead. Returns what happened. Running it again on a removed draft fails with not found.',
		idempotent: false,
	},
	outputSchema: beehiivOutputSchemas.deletePost,
	props: {
		publication_id: aiProps.publicationId(),
		post_id: Property.ShortText({ displayName: 'Post ID', description: 'The post ID (post_...) from "List Posts".', required: true }),
	},
	async run({ auth, propsValue }) {
		const apiKey = apiKeyOf(auth);
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const postId = aiInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
		const path = pathFor(['publications', publicationId, 'posts', postId]);
		const before = await beehiivClient.request({ apiKey, method: 'GET', path, operation: 'get post' });
		const previousStatus = aiInput.optionalText(aiInput.dataOf(before.body)['status']);
		const response = await beehiivClient.request({ apiKey, method: 'DELETE', path, operation: 'delete post' });
		return {
			post_id: postId,
			result: response.status === 202 ? 'pending' : previousStatus === 'draft' ? 'deleted' : 'archived',
			previous_status: previousStatus ?? null,
		};
	},
});
