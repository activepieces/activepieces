import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListTransactionalCampaignsOutputSchema } from '../../output-schemas';

export const senderListTransactionalCampaignsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_transactional_campaigns',
	outputSchema: senderListTransactionalCampaignsOutputSchema,
	displayName: 'List Transactional Campaigns',
	description: 'Lists one page of transactional email templates.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of transactional campaigns (reusable email templates sent one recipient at a time) with their ID, subject, sender and send stats. Use it to find a transactional campaign ID. Page through with Page and Limit using the returned meta.',
		idempotent: true,
	},
	props: {
		page: senderAiProps.page({ required: false }),
		limit: senderAiProps.limit({ required: false }),
	},
	async run(context) {
		return await senderApi.listTransactionalCampaigns({
			auth: context.auth,
			...context.propsValue,
		});
	},
});
