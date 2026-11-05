import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftScheduleOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetScheduleCampaignDraftAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_schedule_campaign_draft',
	outputSchema: mailjetCampaignDraftScheduleOutputSchema,
	displayName: 'Schedule Campaign Draft',
	description: 'Schedules a campaign draft to be sent later.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Schedules a campaign draft for sending at the given time. The draft needs a list, a validated sender and content. Cancel with Cancel Campaign Draft Schedule.',
		idempotent: false,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Send time as RFC 3339 (e.g. "2030-01-01T09:00:00Z") or a Unix timestamp.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/schedule`,
			body: { Date: p.date },
		});
	},
});
