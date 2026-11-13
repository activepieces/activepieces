import { createAction } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { campaignOutputSchema } from '../../output-schemas';

export const getCampaignAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_get_campaign',
	outputSchema: campaignOutputSchema,
	displayName: 'Get Campaign',
	description: 'Gets one campaign with its content and recipients.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one EmailOctopus campaign by ID: status, subject, preview text, sender, target lists, content and send time. For engagement numbers use Get Campaign Summary Report.',
		idempotent: true,
	},
	props: {
		campaignId: emailOctopusAiProps.campaignId({ required: true }),
	},
	async run(context) {
		return await emailOctopusApi.getCampaign({
			auth: context.auth,
			campaignId: context.propsValue.campaignId,
		});
	},
});
