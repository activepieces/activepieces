import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const cloneCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'cloneCampaign',
  displayName: 'Clone Campaign',
  description: 'Clone an existing campaign, optionally renaming.',
  props: zohoCampaignsCommon.cloneCampaignProperties(),
  async run({ auth, propsValue }) {
    const { access_token: accessToken, location } = auth as any;
    await propsValidation.validateZod(
      propsValue,
      zohoCampaignsCommon.cloneCampaignSchema
    );
    const {
      campaignkey,
      campaignname,
      subject,
      from_name,
      from_add,
      reply_to,
      encode_type
    } = propsValue;
    const campaigninfo = {
      oldcampaignkey: campaignkey,
      ...(campaignname && { campaignname }),
      ...(subject && { subject }),
      ...(from_name && { from_name }),
      ...(from_add && { from_add }),
      ...(reply_to && { reply_to }),
      ...(encode_type && { encode_type }),
    };
    return await zohoCampaignsCommon.cloneCampaign({
      accessToken,
      location,
      campaigninfo,
    });
  },
});
