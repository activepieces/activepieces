import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderReportPageOutputSchema } from '../../output-schemas';

export const senderListTransactionalBouncesAction = createAction({
	auth: senderAuth,
	name: 'sender_list_transactional_bounces',
	outputSchema: senderReportPageOutputSchema,
	displayName: 'List Transactional Bounces',
	description: 'Lists one page of the bounces of a transactional campaign.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of bounced emails sent from the campaign, with the bounce type and reason. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.transactionalCampaignId({ required: true }),
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
		direction: senderAiProps.direction({ required: false }),
	},
	async run(context) {
		return await senderApi.listTransactionalReport({
			auth: context.auth,
			report: 'bounces',
			...context.propsValue,
		});
	},
});
