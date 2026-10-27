import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsCampaignReportOutputSchema } from '../../output-schemas';

export const getCampaignReportAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_get_campaign_report',
	displayName: 'Get Campaign Report',
	description: 'Gets the delivery, open, click and bounce figures of a sent campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the report of a sent campaign (key from List Sent Campaigns or List Campaigns): sent, delivered, opens, clicks, bounces, unsubscribes and spam complaints with percentages, plus opens by location. Only sent campaigns have a report.',
		idempotent: true,
	},
	outputSchema: zohoCampaignsCampaignReportOutputSchema,
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.getCampaignReport({
			auth,
			campaignkey: propsValue.campaignKey,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
