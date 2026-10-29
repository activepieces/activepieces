import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { campaignSummaryReportOutputSchema } from '../../output-schemas';

export const getCampaignSummaryReportAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_get_campaign_summary_report',
	outputSchema: campaignSummaryReportOutputSchema,
	displayName: 'Get Campaign Summary Report',
	description: 'Gets sent, open, click, bounce and unsubscribe totals for a campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the engagement totals for a sent EmailOctopus campaign: sent, opened, clicked, bounced, complained and unsubscribed. Use Get Campaign Contact Report for the contacts behind a number.',
		idempotent: true,
	},
	props: {
		campaignId: emailOctopusAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await emailOctopusApi.getCampaignSummaryReport({
			auth: context.auth,
			campaignId: context.propsValue.campaignId,
		});
	},
});
