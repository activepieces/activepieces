import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';

export const activateCampaignAction = createAction({
  auth: instantlyAuth,
  name: 'activate_campaign',
  classification: 'WRITE',
  displayName: 'Activate Campaign',
  description: 'Activates or resumes a campaign in Instantly.',
  audience: 'both',
  aiMetadata: { description: 'Activates or resumes an Instantly campaign by its campaign ID so it starts or continues sending. Use after creating a campaign or to restart a paused one. Idempotent — activating an already-active campaign leaves it active.', idempotent: true },
  props: {
    campaign_id: instantlyProps.campaignId(true),
  },
  async run(context) {
    return instantlyClient.makeRequest({
      auth: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `campaigns/${context.propsValue.campaign_id}/activate`,
    });
  },
});
