import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listCustomFieldsAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_custom_fields',
	classification: 'SEARCH',
	displayName: 'List Custom Fields',
	description: 'Lists the custom subscriber fields of a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the custom subscriber fields defined in a beehiiv publication with their name, kind and list options. Use the name (display) as the key in Custom Fields of "Create Subscription (AI)" and "Update Subscription (AI)". Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listCustomFields,
	props: {
		publication_id: aiProps.publicationId(),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: pathFor(['publications', publicationId, 'custom_fields']),
			operation: 'list custom fields',
			query: {},
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
