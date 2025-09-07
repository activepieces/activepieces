import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const findCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'findCampaign',
  displayName: 'Find Campaign',
  description: 'Locate an existing campaign by campaign name.',
  props: zohoCampaignsCommon.findCampaignProperties,
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.findCampaignSchema
    );
    const { campaignName } = propsValue;
    const campaigns = await zohoCampaignsCommon.listCampaigns({
      accessToken,
    });

    const needle = (campaignName ?? '').trim().toLowerCase();

    // Try to find case-insensitive and partial match
    const campaign = campaigns.filter((campaign) =>
      (campaign.campaign_name ?? '').toLowerCase().includes(needle)
    );

    if (campaign.length === 0) {
      throw new Error(
        `No campaign found with a name containing "${campaignName}" in the selected account.`
      );
    }

    return campaign;
  },
});
