import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderListCampaignErrorsOutputSchema } from '../../output-schemas';

export const senderListCampaignErrorsAction = createAction({
	auth: senderAuth,
	name: 'sender_list_campaign_errors',
	outputSchema: senderListCampaignErrorsOutputSchema,
	displayName: 'List Campaign Errors',
	description: 'Lists the errors that block a campaign from sending.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists the errors and warnings that stop a campaign from being sent, such as a missing subject, unverified sender domain or empty recipient list. Check it when Send Campaign fails.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await senderApi.listCampaignErrors({ auth: context.auth, ...context.propsValue });
	},
});
