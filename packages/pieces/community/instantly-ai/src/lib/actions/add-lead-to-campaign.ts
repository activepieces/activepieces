import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';
import { campaignId, leadId } from '../common/props';

export const addLeadToCampaignAction = createAction({
  auth: instantlyAiAuth,
  name: 'add_lead_to_campaign',
  displayName: 'Add Lead to Campaign',
  description: 'Adds a lead to a campaign.',
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
