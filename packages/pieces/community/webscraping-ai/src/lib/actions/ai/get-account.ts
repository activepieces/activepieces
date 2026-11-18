import { createAction } from '@activepieces/pieces-framework';

import { webscrapingAiAuth } from '../../auth';
import { webscrapingAiApi } from '../../common/api';
import { accountOutputSchema } from '../../output-schemas';

export const getAccountAction = createAction({
	auth: webscrapingAiAuth,
	name: 'webscraping_ai_get_account',
	outputSchema: accountOutputSchema,
	displayName: 'Get Account Info',
	description: 'Returns the account email, remaining credits and concurrency.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the account email, remaining monthly, pay-as-you-go and total credits, when the quota resets, and the free concurrency slots. Use it to check quota before a batch of scraping calls. Takes no inputs.',
		idempotent: true,
	},
	props: {},
	async run({ auth }) {
		return await webscrapingAiApi.getAccountInfo({ auth });
	},
});
