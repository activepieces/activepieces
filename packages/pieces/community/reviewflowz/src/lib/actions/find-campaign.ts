import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzCampaigns } from '../common/campaigns';
import { reviewflowzApi } from '../common/client';
import { ReviewflowzCampaign } from '../common/types';

export const findCampaignAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_campaign',
  classification: 'SEARCH',
  displayName: 'Find Campaign',
  description: 'Finds a review-request campaign by name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find a Reviewflowz review-request campaign by name (exact match first, then the first name containing the words). Returns found: false when none matches. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const campaigns = await reviewflowzApi.listAll<ReviewflowzCampaign>({ auth, path: '/campaigns', max: 500 });
    const wanted = input.name.trim().toLowerCase();
    const exact = campaigns.filter((campaign) => campaign.name.toLowerCase() === wanted);
    const hit = (exact.length > 0 ? exact : campaigns.filter((campaign) => campaign.name.toLowerCase().includes(wanted)))[0];
    return hit ? { found: true, ...reviewflowzCampaigns.campaignOutput(hit) } : { found: false };
  },
});
