import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyCampaign } from '../common/types';

export const updateCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'update_campaign',
  displayName: 'Update Campaign',
  description: 'Updates an existing campaign in Instantly.',
  props: {
    campaign_id: instantlyProps.campaignId(true),
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'New name for the campaign.',
      required: false,
    }),
    daily_limit: Property.Number({
      displayName: 'Daily Limit',
      description: 'Daily limit for sending emails.',
      required: false,
    }),
    stop_on_reply: Property.Checkbox({
      displayName: 'Stop on Reply',
      description: 'Whether to stop campaign on reply.',
      required: false,
    }),
    link_tracking: Property.Checkbox({
      displayName: 'Link Tracking',
      description: 'Whether to track links in emails.',
      required: false,
    }),
    open_tracking: Property.Checkbox({
      displayName: 'Open Tracking',
      description: 'Whether to track opens in emails.',
      required: false,
    }),
    stop_on_auto_reply: Property.Checkbox({
      displayName: 'Stop on Auto Reply',
      description: 'Whether to stop campaign on auto-reply.',
      required: false,
    }),
    daily_max_leads: Property.Number({
      displayName: 'Daily Maximum Leads',
      description: 'Maximum daily new leads to contact.',
      required: false,
    }),
    text_only: Property.Checkbox({
      displayName: 'Text Only',
      description: 'Whether the campaign is text-only.',
      required: false,
    }),
  },
  async run(context) {
    const { campaign_id, ...fields } = context.propsValue;

    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        body[key] = value;
      }
    }

    return instantlyClient.makeRequest<InstantlyCampaign>({
      auth: context.auth.secret_text,
      method: HttpMethod.PATCH,
      path: `campaigns/${campaign_id}`,
      body,
    });
  },
});
