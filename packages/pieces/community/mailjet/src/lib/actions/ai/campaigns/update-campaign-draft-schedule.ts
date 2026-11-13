import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftScheduleOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateCampaignDraftScheduleAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_campaign_draft_schedule',
	outputSchema: mailjetCampaignDraftScheduleOutputSchema,
	displayName: 'Update Campaign Draft Schedule',
	description: 'Changes the scheduled send time of a campaign draft.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Moves the send time of a scheduled campaign draft.',
		idempotent: true,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'New send time as RFC 3339 (e.g. "2030-01-01T09:00:00Z") or a Unix timestamp.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/schedule`,
			body: { Date: p.date },
		});
	},
});
