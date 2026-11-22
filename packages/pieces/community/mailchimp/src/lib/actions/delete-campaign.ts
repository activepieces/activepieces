import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const deleteCampaign = createAction({
  auth: mailchimpAuth,
  name: 'delete_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Campaign',
  description: 'Delete a campaign. Sent campaigns cannot be deleted.',
  audience: 'both',
  aiMetadata: {
    description: 'Deletes a campaign (campaign_id) that has not been sent; it cannot be undone. Not idempotent: a second call fails because the campaign no longer exists.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['campaignAction'],
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  async run(context) {
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    await client.request<unknown>({
      method: HttpMethod.DELETE,
      path,
      operation: 'delete campaign',
    });
    return { success: true, campaign_id: campaignId };
  },
});
