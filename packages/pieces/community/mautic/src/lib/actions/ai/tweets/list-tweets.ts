import { createAction } from '@activepieces/pieces-framework';

import { mauticListTweetsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListTweetsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_tweets',
	outputSchema: mauticListTweetsOutputSchema,
	displayName: 'List Tweets',
	description: 'Lists Mautic tweets.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists tweet templates used by campaigns. Needs the Social plugin with Twitter configured. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'tweets',
			key: 'tweets',
			query: context.propsValue,
		});
	},
});
