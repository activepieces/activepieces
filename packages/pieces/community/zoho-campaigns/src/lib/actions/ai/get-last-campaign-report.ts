import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCampaignReportOutputSchema } from '../../output-schemas';

export const getLastCampaignReportAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_get_last_campaign_report',
	displayName: 'Get Last Campaign Report',
	description: 'Gets the report of the most recently sent campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the report of the most recently sent campaign in the account, with no key needed. Use Get Campaign Report for any other sent campaign.',
		idempotent: true,
	},
	outputSchema: zohoCampaignsCampaignReportOutputSchema,
	props: {},
	async run({ auth }) {
		const body = await zohoCampaignsApi.getLastCampaignReport({ auth });
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
