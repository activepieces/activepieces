import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftWithTemplateOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCampaignDraftAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_campaign_draft',
	outputSchema: mailjetCampaignDraftWithTemplateOutputSchema,
	displayName: 'Get Campaign Draft',
	description: 'Gets one campaign draft.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a campaign draft by its numeric ID, including its list, sender, subject and status.',
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
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}`,
		});
	},
});
