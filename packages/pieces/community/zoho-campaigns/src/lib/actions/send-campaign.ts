import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const sendCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'sendCampaign',
  displayName: 'Send Campaign',
  description: 'Send a campaign that has been created or cloned.',
  props: zohoCampaignsCommon.sendCampaignProperties(),
  async run({ auth: { access_token: accessToken }, propsValue }) {
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.sendCampaignSchema
    );
    const { campaignkey } = propsValue;
    return await zohoCampaignsCommon.sendCampaign({
      accessToken,
      campaignkey: campaignkey as string,
    });
  },
});
