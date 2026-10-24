import { createAction } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsSendCampaignOutputSchema } from '../../output-schemas';

export const sendCampaignAiAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_send_campaign',
	displayName: 'Send Campaign',
	description: 'Sends a draft campaign now.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends a draft campaign (key from Create Campaign, Clone Campaign or List Campaigns) to its recipients immediately. Use Schedule Campaign to send later. Not idempotent and irreversible: emails go out to every recipient. Sending needs a sender domain with SPF and DKIM set up in Zoho; until then it fails with "Content not reviewed".',
		idempotent: false,
	},
	outputSchema: zohoCampaignsSendCampaignOutputSchema,
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.sendCampaign({ auth, campaignkey: propsValue.campaignKey });
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
