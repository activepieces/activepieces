import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const unscheduleCampaign = createAction({
  auth: mailchimpAuth,
  name: 'unschedule_campaign',
  classification: 'WRITE',
  displayName: 'Unschedule Campaign',
  description: 'Cancel the schedule of a scheduled campaign and return it to draft. Requires a paid Mailchimp plan.',
  audience: 'both',
  aiMetadata: {
    description: 'Cancels the scheduled send of a campaign (campaign_id with status schedule) and returns it to draft. Not idempotent: the call fails when the campaign is not scheduled.',
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
      method: HttpMethod.POST,
      path: `${path}/actions/unschedule`,
      operation: 'unschedule campaign',
    });
    return { success: true, campaign_id: campaignId };
  },
});
