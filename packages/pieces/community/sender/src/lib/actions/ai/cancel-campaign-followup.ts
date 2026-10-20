import { createAction } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderAiProps } from '../../common/ai-props';
import { senderApi } from '../../common/api';
import { senderSuccessOutputSchema } from '../../output-schemas';

export const senderCancelCampaignFollowupAction = createAction({
	auth: senderAuth,
	name: 'sender_cancel_campaign_followup',
	outputSchema: senderSuccessOutputSchema,
	displayName: 'Cancel Campaign Follow-up',
	description: 'Cancels the automatic follow-up of a campaign.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Cancels the automatic follow-up email (resent to subscribers who did not open) of a sent campaign that has auto follow-up turned on.',
		idempotent: true,
	},
	props: {
		campaignId: senderAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await senderApi.cancelCampaignFollowup({ auth: context.auth, ...context.propsValue });
	},
});
