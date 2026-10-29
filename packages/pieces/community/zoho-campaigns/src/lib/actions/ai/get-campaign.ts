import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsGetCampaignOutputSchema } from '../../output-schemas';

export const getCampaignAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_get_campaign',
	outputSchema: zohoCampaignsGetCampaignOutputSchema,
	displayName: 'Get Campaign',
	description: 'Gets a campaign with its sender, mailing lists, status and report.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one campaign by its campaign key (from List Campaigns): sender details, associated mailing lists and segments, recipient count and its report figures. Set Campaign Type to abtesting for A/B test campaigns.',
		idempotent: true,
	},
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
		campaignType: Property.StaticDropdown<'normal' | 'abtesting', false>({
			displayName: 'Campaign Type',
			description: 'normal (default) or abtesting for an A/B test campaign.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Normal', value: 'normal' },
					{ label: 'A/B Testing', value: 'abtesting' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.getCampaignDetails({
			auth,
			campaignkey: propsValue.campaignKey,
			campaigntype: propsValue.campaignType,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
