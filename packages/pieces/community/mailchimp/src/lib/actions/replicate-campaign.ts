import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

import { ApiCampaign } from '../common/client';

export const replicateCampaign = createAction({
  auth: mailchimpAuth,
  name: 'replicate_campaign',
  classification: 'WRITE',
  displayName: 'Replicate Campaign',
  description: 'Create a new draft copy of an existing campaign.',
  audience: 'both',
  aiMetadata: {
    description: 'Copies an existing campaign (campaign_id) into a new draft with the same settings and content, and returns the new campaign ID. Not idempotent: each call creates another copy.',
    idempotent: false,
  },
  outputSchema: mailchimpOutputSchemas['campaign'],
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  async run(context) {
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    const campaign = await client.request<ApiCampaign>({
      method: HttpMethod.POST,
      path: `${path}/actions/replicate`,
      operation: 'replicate campaign',
    });
    return mailchimpApi.toCampaignSummary(campaign);
  },
});
