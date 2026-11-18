import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzCampaigns } from '../common/campaigns';
import { reviewflowzProps } from '../common/props';

export const turnOnCampaignAction = createAction({
  auth: reviewflowzAuth,
  name: 'turn_on_campaign',
  classification: 'WRITE',
  displayName: 'Turn on Campaign',
  description: 'Starts a campaign: customers added from now on get its request.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turn on (activate) a Reviewflowz review-request campaign so customers added from now on are sent its request. Fails with the reason when the campaign is not ready (no destination, channel not set up). Safe to retry.',
    idempotent: true,
  },
  props: {
    campaign: reviewflowzProps.campaign(),
  },
  async run(context) {
    return reviewflowzCampaigns.campaignOutput(
      await reviewflowzCampaigns.activate({ auth: context.auth, id: context.propsValue.campaign }),
    );
  },
});
