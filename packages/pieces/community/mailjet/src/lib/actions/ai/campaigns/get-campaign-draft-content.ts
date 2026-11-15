import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftContentOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCampaignDraftContentAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_campaign_draft_content',
	outputSchema: mailjetCampaignDraftContentOutputSchema,
	displayName: 'Get Campaign Draft Content',
	description: 'Gets the content of a campaign draft.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets the HTML, text and MJML content and headers of a campaign draft.',
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
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/detailcontent`,
		});
	},
});
