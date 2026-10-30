import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftScheduleOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCampaignDraftScheduleAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_campaign_draft_schedule',
	outputSchema: mailjetCampaignDraftScheduleOutputSchema,
	displayName: 'Get Campaign Draft Schedule',
	description: 'Gets the scheduled send time of a campaign draft.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the scheduled date and status of a campaign draft. Returns a 404 error when the draft is not scheduled.',
		idempotent: true,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/schedule`,
		});
	},
});
