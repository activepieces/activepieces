import { createAction } from '@activepieces/pieces-framework';

import { mailjetCampaignOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetCampaignAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_campaign',
	outputSchema: mailjetCampaignOutputSchema,
	displayName: 'Get Campaign',
	description: 'Gets one sent campaign.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a sent campaign by its numeric ID.',
		idempotent: true,
	},
	props: {
		campaignId: mailjetAiProps.id({
			displayName: 'Campaign ID',
			description: 'Numeric campaign ID, from List Campaigns.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v3/REST/campaign/${encodeURIComponent(p.campaignId)}`,
		});
	},
});
