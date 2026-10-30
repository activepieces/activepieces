import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetUpdateCampaignAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_update_campaign',
	outputSchema: mailjetCampaignOutputSchema,
	displayName: 'Update Campaign',
	description: 'Stars or deletes a sent campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the starred and/or deleted flag of a sent campaign. Only the flags you set change.',
		idempotent: true,
	},
	props: {
		campaignId: mailjetAiProps.id({
			displayName: 'Campaign ID',
			description: 'Numeric campaign ID, from List Campaigns.',
		}),
		isStarred: mailjetAiProps.yesNo({
			displayName: 'Starred',
			description: 'Yes stars the campaign, No unstars it.',
		}),
		isDeleted: mailjetAiProps.yesNo({
			displayName: 'Deleted',
			description: 'Yes marks the campaign deleted, No restores it.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.put({
			auth: context.auth,
			path: `/v3/REST/campaign/${encodeURIComponent(p.campaignId)}`,
			body: { IsStarred: p.isStarred, IsDeleted: p.isDeleted },
		});
	},
});
