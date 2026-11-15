import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftStatusOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetSendCampaignDraftAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_send_campaign_draft',
	outputSchema: mailjetCampaignDraftStatusOutputSchema,
	displayName: 'Send Campaign Draft',
	description: 'Sends a campaign draft to its contact list now.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends the campaign draft immediately to every subscribed contact of its list (or segment). Cannot be undone. The draft needs a list, a validated sender and content.',
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
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/send`,
			body: {},
		});
	},
});
