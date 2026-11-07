import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListSentCampaignsOutputSchema } from '../../output-schemas';

export const listSentCampaignsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_sent_campaigns',
	outputSchema: zohoCampaignsListSentCampaignsOutputSchema,
	displayName: 'List Sent Campaigns',
	description: 'Lists the most recently sent campaigns.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the most recently sent campaigns with their campaign keys, names and send times, newest first. Use it to find a sent campaign for Get Campaign Report or List Campaign Recipients.',
		idempotent: true,
	},
	props: {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'How many sent campaigns to return. Defaults to 10.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.listSentCampaigns({ auth, limit: propsValue.limit ?? 10 });
		const result = zohoCampaignsUtils.assertSuccess({ body });
		return { ...result, recent_sent_campaigns: result.recent_sent_campaigns ?? null };
	},
});
