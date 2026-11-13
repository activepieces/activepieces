import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderCampaignWriteOutputSchema } from '../../output-schemas';

export const senderCopyCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_copy_campaign',
	outputSchema: senderCampaignWriteOutputSchema,
	displayName: 'Copy Campaign',
	description: 'Copies an email campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new draft that copies an existing campaign, and returns the copy with its new ID. Each call makes another copy.',
		idempotent: false,
	},
	props: {
		campaignId: senderAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await senderApi.copyCampaign({ auth: context.auth, ...context.propsValue });
	},
});
