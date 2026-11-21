import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyBackgroundJob, InstantlyLead } from '../common/types';

const MAX_POLL_ATTEMPTS = 100;
const POLL_INTERVAL_MS = 5000;
const UNFINISHED_JOB_STATUSES = ['pending', 'in-progress', 'draining', 'paused'];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function moveSource(lead: InstantlyLead): Record<string, string> {
  if (lead.campaign) {
    return { campaign: lead.campaign };
  }
  if (lead.list_id) {
    return { list_id: lead.list_id };
  }
  return {};
}

export const addLeadToCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'add_lead_to_campaign',
  classification: 'WRITE',
  displayName: 'Add Lead to Campaign',
  description: 'Adds a lead to a campaign.',
  audience: 'both',
  aiMetadata: { description: 'Moves an existing lead into a campaign by lead ID and campaign ID, then polls the resulting background job until it completes. Optionally skip the lead if it already exists in the campaign. Use when assigning a known lead to a specific outreach campaign. Not idempotent — it triggers a move/add operation each call.', idempotent: false },
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

    const lead = await instantlyClient.makeRequest<InstantlyLead>({
      auth,
      method: HttpMethod.GET,
      path: `leads/${lead_id}`,
    });

    const response = await instantlyClient.makeRequest<InstantlyBackgroundJob>({
      auth,
      method: HttpMethod.POST,
      path: 'leads/move',
      body: {
        ids: [lead_id],
        ...moveSource(lead),
        to_campaign_id: campaign_id,
        check_duplicates_in_campaigns: skip_if_in_campaign,
      },
    });

    let { status } = response;
    let attempts = 0;

    while (UNFINISHED_JOB_STATUSES.includes(status)) {
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

    if (status === 'failed' || status === 'cancelled') {
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
