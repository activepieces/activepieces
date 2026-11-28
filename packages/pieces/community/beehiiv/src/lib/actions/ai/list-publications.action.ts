import { createAction } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../common/auth';
import { apiKeyOf, beehiivClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { beehiivOutputSchemas } from '../../common/output-schemas';

export const listPublicationsAiAction = createAction({
	auth: beehiivAuth,
	name: 'list_publications',
	classification: 'SEARCH',
	displayName: 'List Publications',
	description: 'Lists the publications in the connected beehiiv workspace.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the beehiiv publications (newsletters) the API key can access, with their IDs and optional subscriber and engagement stats. Call this first to get the Publication ID every other beehiiv tool needs. Read-only.',
		idempotent: true,
	},
	outputSchema: beehiivOutputSchemas.listPublications,
	props: {
		include_stats: aiProps.yesNo({ displayName: 'Include Stats', description: 'Yes to add subscriber counts, open and click rates.' }),
		limit: aiProps.limit(),
		page: aiProps.page(),
	},
	async run({ auth, propsValue }) {
		const includeStats = aiInput.yesNo({ value: propsValue.include_stats, label: 'Include Stats' });
		return beehiivClient.listPage({
			apiKey: apiKeyOf(auth),
			path: '/publications',
			operation: 'list publications',
			query: { 'expand[]': includeStats === true ? ['stats'] : undefined },
			page: aiInput.integerInRange({ value: propsValue.page, label: 'Page', min: 1, max: 100, fallback: 1 }),
			limit: aiInput.integerInRange({ value: propsValue.limit, label: 'Limit', min: 1, max: 100, fallback: 25 }),
		});
	},
});
