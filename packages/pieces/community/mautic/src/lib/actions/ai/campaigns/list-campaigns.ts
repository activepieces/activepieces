import { createAction } from '@activepieces/pieces-framework';

import { mauticListCampaignsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticListCampaignsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_list_campaigns',
	outputSchema: mauticListCampaignsOutputSchema,
	displayName: 'List Campaigns',
	description: 'Lists Mautic campaigns.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists campaigns with their events. Use Search for free text or Where for exact column conditions. Page with Start and Limit; the response has the total count.',
		idempotent: true,
	},
	props: {
		...mauticAiProps.listOptions,
	},
	async run(context) {
		return await mauticApi.listRecords({
			auth: context.auth,
			resource: 'campaigns',
			key: 'campaigns',
			query: context.propsValue,
		});
	},
});
