import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const cloneCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'cloneCampaign',
  displayName: 'Clone Campaign',
  description: 'Clone an existing campaign, optionally renaming.',
  props: zohoCampaignsCommon.cloneCampaignProperties(),
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.cloneCampaignSchema
    );
    const { campaignkey } = propsValue;
    const campaigninfo = await zohoCampaignsCommon.getCampaign({
      accessToken,
      campaignkey: campaignkey as string,
    });
    return await zohoCampaignsCommon.cloneCampaign({
      accessToken,
      campaigninfo,
    });
  },
});
