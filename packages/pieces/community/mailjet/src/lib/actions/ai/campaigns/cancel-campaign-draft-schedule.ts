import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetCancelCampaignDraftScheduleAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_cancel_campaign_draft_schedule',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Cancel Campaign Draft Schedule',
	description: 'Cancels the scheduled sending of a campaign draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Cancels the schedule of a campaign draft so it goes back to draft state. The draft itself is kept.',
		idempotent: false,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/schedule`,
		});
	},
});
