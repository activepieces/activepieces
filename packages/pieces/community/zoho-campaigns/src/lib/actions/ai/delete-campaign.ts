import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsStatusOutputSchema } from '../../output-schemas';

export const deleteCampaignAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_delete_campaign',
	outputSchema: zohoCampaignsStatusOutputSchema,
	displayName: 'Delete Campaign',
	description: 'Permanently deletes a campaign.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a campaign (key from List Campaigns), including a scheduled one, which cancels its send. This is a hard delete and cannot be undone.',
		idempotent: false,
	},
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.deleteCampaign({
			auth,
			campaignkey: propsValue.campaignKey,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
