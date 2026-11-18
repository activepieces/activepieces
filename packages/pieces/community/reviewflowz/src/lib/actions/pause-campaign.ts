import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzCampaigns } from '../common/campaigns';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';
import { ReviewflowzCampaign } from '../common/types';

export const pauseCampaignAction = createAction({
  auth: reviewflowzAuth,
  name: 'pause_campaign',
  classification: 'WRITE',
  displayName: 'Pause Campaign',
  description: 'Stops a campaign. Follow-ups already scheduled wait until it is turned back on.',
  audience: 'both',
  aiMetadata: {
    description:
      'Pause a Reviewflowz review-request campaign: no new requests go out and scheduled follow-ups wait until it is turned back on. A campaign already off is left as it is, so retries are safe.',
    idempotent: true,
  },
  props: {
    campaign: reviewflowzProps.campaign(),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const response = await reviewflowzApi.send<ReviewflowzCampaign>({
      auth,
      method: HttpMethod.POST,
      path: `/campaigns/${encodeURIComponent(String(propsValue.campaign))}/pause`,
    });
    if (response.ok) {
      return reviewflowzCampaigns.campaignOutput(response.body);
    }
    if (response.status === 409) {
      return reviewflowzCampaigns.campaignOutput(await reviewflowzCampaigns.getCampaign({ auth, id: propsValue.campaign }));
    }
    throw new Error(reviewflowzApi.errorMessage({ status: response.status, body: response.body }));
  },
});
