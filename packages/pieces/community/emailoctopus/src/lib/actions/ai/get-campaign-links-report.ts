import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { campaignLinksReportOutputSchema } from '../../output-schemas';

export const getCampaignLinksReportAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_get_campaign_links_report',
	outputSchema: campaignLinksReportOutputSchema,
	displayName: 'Get Campaign Links Report',
	description: 'Gets total and unique clicks for each link in a campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the click counts (total and unique) for every link in a sent EmailOctopus campaign. To see who clicked, use Get Campaign Contact Report with status clicked.',
		idempotent: true,
	},
	props: {
		campaignId: emailOctopusAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await emailOctopusApi.getCampaignLinksReport({
			auth: context.auth,
			campaignId: context.propsValue.campaignId,
		});
	},
});
