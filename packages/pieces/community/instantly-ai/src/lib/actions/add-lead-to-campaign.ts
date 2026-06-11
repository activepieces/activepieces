import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../auth';
import { campaignId, leadId } from '../common/props';

export const addLeadToCampaignAction = createAction({
  auth: instantlyAiAuth,
  name: 'add_lead_to_campaign',
  displayName: 'Add Lead to Campaign',
  description: 'Adds a lead to a campaign.',
  audience: 'both',
  aiMetadata: { description: 'Moves an existing lead into a campaign by lead ID and campaign ID, then polls the resulting background job until it completes. Optionally skip the lead if it already exists in the campaign. Use when assigning a known lead to a specific outreach campaign. Not idempotent — it triggers a move/add operation each call.', idempotent: false },
  props: {
    lead_id: leadId(true),
    campaign_id: campaignId(true),
    skip_if_in_campaign: Property.Checkbox({
      displayName: 'Skip if in Campaign',
      defaultValue: false,
      description: 'Skip lead if it exists in the campaign.',
      required: false,
    }),
  },
  async run(context) {
    const { lead_id, campaign_id, skip_if_in_campaign } = context.propsValue;

    const response = (await makeRequest({
      apiKey: context.auth,
      endpoint: 'leads/move',
      method: HttpMethod.POST,
      body: {
        ids: [lead_id],
        to_campaign_id: campaign_id,
        check_duplicates_in_campaigns: skip_if_in_campaign,
      },
    })) as { id: string; status: string };

    const jobId = response.id;
    let jobStatus = response.status;

    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    while (['pending', 'in-progress'].includes(jobStatus)) {
      await wait(3000);

      const jobResponse = (await makeRequest({
        apiKey: context.auth,
        endpoint: `background-jobs/${jobId}`,
        method: HttpMethod.GET,
      })) as { status: string };

      jobStatus = jobResponse.status;
    }

    return {
      ...response,
      status: 'success',
    };
  },
});
