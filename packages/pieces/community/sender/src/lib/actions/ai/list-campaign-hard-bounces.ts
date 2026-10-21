import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderReportPageOutputSchema } from '../../output-schemas';

export const senderListCampaignHardBouncesAction = createAction({
	auth: senderAuth,
	name: 'sender_list_campaign_hard_bounces',
	outputSchema: senderReportPageOutputSchema,
	displayName: 'List Campaign Hard Bounces',
	description: 'Lists one page of the hard bounces of a campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of the subscribers who hard-bounced (permanent delivery failure), with the reason. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.campaignId({ required: true }),
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listCampaignReport({
			auth: context.auth,
			report: 'hard_bounces',
			...context.propsValue,
		});
	},
});
