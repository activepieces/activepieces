import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listTiersAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_tiers',
	classification: 'SEARCH',
	displayName: 'List Tiers',
	description: 'Lists the subscription tiers of a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the free and paid subscription tiers of a beehiiv publication, optionally with prices. Use the IDs as Premium Tier IDs in Create or Update Subscription (AI). Paid tiers exist only when the publication sells subscriptions. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listTiers,
	props: {
		publication_id: aiProps.publicationId(),
		include_prices: aiProps.yesNo({ displayName: 'Include Prices', description: 'Yes to add the prices of each tier.' }),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: pathFor(['publications', publicationId, 'tiers']),
			operation: 'list tiers',
			query: { 'expand[]': aiInput.yesNo({ value: propsValue.include_prices, label: 'Include Prices' }) === true ? ['prices'] : undefined },
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
