import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';

export const pauseCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'pause_campaign',
  displayName: 'Pause Campaign',
  description: 'Pauses a running campaign in Instantly.',
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
