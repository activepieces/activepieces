import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftStatusOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetSendCampaignDraftTestAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_send_campaign_draft_test',
	outputSchema: mailjetCampaignDraftStatusOutputSchema,
	displayName: 'Send Campaign Draft Test',
	description: 'Sends a test of a campaign draft to chosen addresses.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a test copy of a campaign draft to the given recipients without sending the campaign. The draft needs content and a validated sender.',
		idempotent: false,
	},
	props: {
		draftId: mailjetAiProps.id({
			displayName: 'Campaign Draft ID',
			description: 'Numeric campaign draft ID, from List Campaign Drafts or Create Campaign Draft.',
		}),
		recipients: Property.Json({
			displayName: 'Recipients',
			description: 'JSON array of test recipients, e.g. [{"Email":"me@example.com","Name":"Me"}].',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/test`,
			body: { Recipients: p.recipients },
		});
	},
});
