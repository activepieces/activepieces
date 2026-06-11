import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoCampaignsAuth, zohoCampaignsCommon } from '../common';

export const cloneCampaign = createAction({
  auth: zohoCampaignsAuth,
  name: 'cloneCampaign',
  displayName: 'Clone Campaign',
  description: 'Clone an existing campaign, optionally renaming.',
  audience: 'both',
  aiMetadata: {
    description:
      'Duplicates an existing Zoho Campaigns campaign (identified by its campaign key) into a new draft, optionally overriding name, subject, sender name/address, reply-to, and encoding. Use to reuse a prior campaign as a starting point. Not idempotent: each call produces a new campaign.',
    idempotent: false,
  },
  props: zohoCampaignsCommon.cloneCampaignProperties(),
  async run({ auth, propsValue }) {
    const location = auth.props?.['location'] as string || 'zoho.com';
    const accessToken = auth.access_token;
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
      encode_type,
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
