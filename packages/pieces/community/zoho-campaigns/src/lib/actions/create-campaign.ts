import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';
export const createCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'createCampaign',
  displayName: 'Create Campaign',
  description:
    'Create a new campaign with campaign name, subject, topic, sender name/address, and mailing list.',
  props: zohoCampaignsCommon.createCampaignProperties(),
  async run({ auth, propsValue }) {
    const location = auth.props?.['location'] as string || 'zoho.com';
    const accessToken = auth.access_token ;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.createCampaignSchema
    );
    const list_details =
      propsValue.list_details?.reduce((acc, curr) => {
        acc[curr] = [];
        return acc;
      }, {} as { [key: string]: [] }) || {};

    return await zohoCampaignsCommon.createCampaign({
      accessToken,
      location,
      ...propsValue,
      list_details,
    });
  },
});
