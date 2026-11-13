import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegrapghaiGetCreditsOutputSchema } from '../../output-schemas';

export const getCreditsAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_get_credits',
	outputSchema: scrapegrapghaiGetCreditsOutputSchema,
	displayName: 'Get Credits',
	description: 'Gets the remaining credit balance, plan and job quotas.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns remaining and used credits, the plan name, and crawl and monitor job slots used vs the plan limit. Free to call; use it before a large batch. Takes no inputs.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		return await scrapegraphaiApi.getCredits({ auth });
	},
});
