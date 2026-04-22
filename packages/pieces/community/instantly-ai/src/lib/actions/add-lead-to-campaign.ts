import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyBackgroundJob } from '../common/types';

const MAX_POLL_ATTEMPTS = 100;
const POLL_INTERVAL_MS = 5000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const addLeadToCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'add_lead_to_campaign',
  displayName: 'Add Lead to Campaign',
  description: 'Adds a lead to a campaign.',
  props: {
    lead_id: instantlyProps.leadId(true),
    campaign_id: instantlyProps.campaignId(true),
    skip_if_in_campaign: Property.Checkbox({
      displayName: 'Skip if in Campaign',
      defaultValue: false,
      description: 'Skip lead if it exists in the campaign.',
      required: false,
    }),
  },
  async run(context) {
    const { lead_id, campaign_id, skip_if_in_campaign } = context.propsValue;
    const auth = context.auth.secret_text;

    const response = await instantlyClient.makeRequest<InstantlyBackgroundJob>({
      auth,
      method: HttpMethod.POST,
      path: 'leads/move',
      body: {
        ids: [lead_id],
        to_campaign_id: campaign_id,
        check_duplicates_in_campaigns: skip_if_in_campaign,
      },
    });

    let { status } = response;
    let attempts = 0;

    while (['pending', 'in-progress'].includes(status)) {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error(
          `Background job ${response.id} did not complete after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000} seconds. Last status: ${status}`,
        );
      }

      await wait(POLL_INTERVAL_MS);
      attempts++;

      const jobResponse = await instantlyClient.makeRequest<InstantlyBackgroundJob>({
        auth,
        method: HttpMethod.GET,
        path: `background-jobs/${response.id}`,
      });

      status = jobResponse.status;
    }

    if (status === 'failed' || status === 'error') {
      throw new Error(
        `Background job ${response.id} failed with status: ${status}`,
      );
    }

    return {
      ...response,
      status,
    };
  },
});
