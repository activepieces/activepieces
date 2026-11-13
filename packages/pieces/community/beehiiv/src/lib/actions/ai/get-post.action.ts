import { Property, createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { POST_EXPAND_VALUES, aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const getPostAiAction = createAction({
	auth: beehiivAuth,
	name: 'get_post',
	classification: 'READ',
	displayName: 'Get Post',
	description: 'Gets one post, optionally with stats and rendered content.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets one beehiiv post by Post ID (from "List Posts"), optionally with email/web stats and the rendered HTML (free web, email or RSS; premium web or email). Rendered content can be large; request only what you need. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.getPost,
	props: {
		publication_id: aiProps.publicationId(),
		post_id: Property.ShortText({ displayName: 'Post ID', description: 'The post ID (post_...).', required: true }),
		include: Property.StaticMultiSelectDropdown<string>({
			displayName: 'Include',
			description: 'Extra data to add.',
			required: false,
			options: { options: POST_EXPAND_VALUES.map((value) => ({ label: value, value })) },
		}),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		const postId = aiInput.requireText({ value: propsValue.post_id, label: 'Post ID' });
		const include = aiInput.textList({ value: propsValue.include, label: 'Include' });
		const unknown = (include ?? []).filter((value) => !POST_EXPAND_VALUES.some((allowed) => allowed === value));
		if (unknown.length > 0) {
			throw new Error(`Include has unknown values: ${unknown.join(', ')}. Allowed: ${POST_EXPAND_VALUES.join(', ')}.`);
		}
		const response = await beehiivClient.request({
			apiKey: apiKeyOf(auth),
			method: 'GET',
			path: pathFor(['publications', publicationId, 'posts', postId]),
			operation: 'get post',
			query: { 'expand[]': include },
			retryPending: true,
		});
		return aiInput.dataOf(response.body);
	},
});
