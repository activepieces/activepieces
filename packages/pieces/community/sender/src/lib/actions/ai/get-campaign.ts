import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetCampaignOutputSchema } from '../../output-schemas';

export const senderGetCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_get_campaign',
	outputSchema: senderGetCampaignOutputSchema,
	displayName: 'Get Campaign',
	description: 'Gets an email campaign by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one email campaign by ID: subject, sender, status, schedule, content and open, click and bounce counts.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await senderApi.getCampaign({ auth: context.auth, ...context.propsValue });
	},
});
