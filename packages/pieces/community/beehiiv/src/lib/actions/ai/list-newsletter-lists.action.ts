import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listNewsletterListsAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_newsletter_lists',
	classification: 'SEARCH',
	displayName: 'List Newsletter Lists',
	description: 'Lists the newsletter lists of a publication.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the newsletter lists (sub-newsletters a subscriber can join) of a beehiiv publication with IDs and subscriber counts. Use the IDs in Create or Update Subscription (AI). Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listNewsletterLists,
	props: {
		publication_id: aiProps.publicationId(),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const publicationId = aiInput.requireText({ value: propsValue.publication_id, label: 'Publication ID' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: pathFor(['publications', publicationId, 'newsletter_lists']),
			operation: 'list newsletter lists',
			query: {},
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
