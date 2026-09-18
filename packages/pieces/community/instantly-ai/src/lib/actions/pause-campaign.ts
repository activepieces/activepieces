import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';

export const pauseCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'pause_campaign',
  classification: 'WRITE',
  displayName: 'Pause Campaign',
  description: 'Pauses a running campaign in Instantly.',
  audience: 'both',
  aiMetadata: { description: 'Pauses a running Instantly campaign by its campaign ID so it stops sending until reactivated. Use to halt outreach without deleting the campaign. Idempotent — pausing an already-paused campaign leaves it paused.', idempotent: true },
  props: {
    campaign_id: instantlyProps.campaignId(true),
  },
  async run(context) {
    return instantlyClient.makeRequest({
      auth: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `campaigns/${context.propsValue.campaign_id}/pause`,
    });
  },
});
