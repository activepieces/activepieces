import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignDraftStatusOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCampaignDraftStatusAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_campaign_draft_status',
	outputSchema: mailjetCampaignDraftStatusOutputSchema,
	displayName: 'Get Campaign Draft Status',
	description: 'Gets the sending status of a campaign draft.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the sending status of a campaign draft after Send Campaign Draft or Schedule Campaign Draft.',
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
			path: `/v3/REST/campaigndraft/${encodeURIComponent(p.draftId)}/status`,
		});
	},
});
