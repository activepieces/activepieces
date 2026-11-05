import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderCancelScheduledCampaignAction = createAction({
	auth: senderAuth,
	name: 'sender_cancel_scheduled_campaign',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Cancel Scheduled Campaign',
	description: 'Cancels a scheduled campaign.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Cancels the schedule of a campaign that has not sent yet, returning it to draft.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await senderApi.cancelCampaignSchedule({ auth: context.auth, ...context.propsValue });
	},
});
