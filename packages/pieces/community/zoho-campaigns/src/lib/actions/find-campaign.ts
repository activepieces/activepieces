import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const findCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'findCampaign',
  displayName: 'Find Campaign',
  description: 'Locate an existing campaign by campaign name.',
  props: zohoCampaignsCommon.findCampaignProperties(),
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.findCampaignSchema
    );
    const { campaignName, status, sort, fromindex, range } = propsValue;

    const searchParams: any = {
      accessToken,
    };

    if (status) searchParams.status = status;
    if (sort) searchParams.sort = sort;
    if (fromindex) searchParams.fromindex = fromindex;
    if (range) searchParams.range = range;

    const campaigns = await zohoCampaignsCommon.listCampaigns({
      ...searchParams,
      location
    });
    const needle = (campaignName ?? '').trim().toLowerCase();

    // Try to find case-insensitive and partial match
    const matchingCampaigns = campaigns.filter((campaign) =>
      (campaign.campaign_name ?? '').toLowerCase().includes(needle)
    );

    if (matchingCampaigns.length === 0) {
      const statusText = status ? ` with status "${status}"` : '';
      throw new Error(
        `No campaign found with a name containing "${campaignName}"${statusText} in the selected account.`
      );
    }

    return matchingCampaigns;
  },
});
