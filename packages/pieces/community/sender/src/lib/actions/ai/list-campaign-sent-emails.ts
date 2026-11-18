import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderReportPageOutputSchema } from '../../output-schemas';

export const senderListCampaignSentEmailsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_campaign_sent_emails',
	outputSchema: senderReportPageOutputSchema,
	displayName: 'List Campaign Sent Emails',
	description: 'Lists one page of the recipients the campaign was sent to of a campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of the subscribers who were sent the campaign. Page through with Page and Limit using the returned meta.',
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
			report: 'emails-sent',
			...context.propsValue,
		});
	},
});
