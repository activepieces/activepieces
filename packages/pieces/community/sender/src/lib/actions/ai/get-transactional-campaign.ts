import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderGetTransactionalCampaignOutputSchema } from '../../output-schemas';

export const senderGetTransactionalCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_get_transactional_campaign',
	outputSchema: senderGetTransactionalCampaignOutputSchema,
	displayName: 'Get Transactional Campaign',
	description: 'Gets a transactional campaign by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one transactional campaign by ID: subject, sender, editor type, HTML and send stats.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.transactionalCampaignId({ required: true }),
	},
	async run(context) {
		return await senderApi.getTransactionalCampaign({ auth: context.auth, ...context.propsValue });
	},
});
