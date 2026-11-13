import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listPostTemplatesAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_post_templates',
	classification: 'SEARCH',
	displayName: 'List Post Templates',
	description: 'Lists the post templates of a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the post templates of a beehiiv publication with their IDs and names. Use an ID as Post Template ID in "Create Draft Post". Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listPostTemplates,
	props: {
		publication_id: aiProps.publicationId(),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: pathFor(['publications', publicationId, 'post_templates']),
			operation: 'list post templates',
			query: {},
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
