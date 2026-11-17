import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const getCampaignContent = createAction({
  auth: mailchimpAuth,
  name: 'get_campaign_content',
  classification: 'READ',
  displayName: 'Get Campaign Content',
  description: 'Get the HTML and plain-text content of a campaign.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the HTML and plain-text body of one campaign by campaign_id (from List Campaigns or Find Campaign). Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['campaignContent'],
  props: {
    campaign_id: mailchimpCommon.mailChimpCampaignIdDropdown,
  },
  async run(context) {
    const campaignId = mailchimpApi.requireText({ value: context.propsValue.campaign_id, label: 'Campaign' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const path = `/campaigns/${encodeURIComponent(campaignId)}`;
    const content = await client.request<CampaignContent>({
      method: HttpMethod.GET,
      path: `${path}/content`,
      operation: 'get campaign content',
    });
    return {
      campaign_id: campaignId,
      html: content.html ?? '',
      plain_text: content.plain_text ?? '',
    };
  },
});

type CampaignContent = { html?: string; plain_text?: string };
