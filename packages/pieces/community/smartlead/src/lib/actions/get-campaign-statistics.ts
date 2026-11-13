import { createAction } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations } from '../common/operations';
import { smartleadOutputSchemas } from '../common/output-schemas';
import { smartleadProps } from '../common/props';

export const getCampaignStatisticsAction = createAction({
  auth: smartleadAuth,
  name: 'get_campaign_statistics',
  classification: 'READ',
  displayName: 'Get Campaign Statistics',
  description:
    'Retrieve comprehensive analytics for a campaign including open rates, click rates, reply rates, and engagement statistics.',
  audience: 'human',
  outputSchema: smartleadOutputSchemas.campaignStatistics,
  props: {
    campaign_id: smartleadProps.campaignDropdown({
      description: 'The campaign to get statistics for',
    }),
  },
  async run(context) {
    return smartleadOperations.getCampaignStatistics({
      apiKey: context.auth.secret_text,
      campaignId: context.propsValue.campaign_id,
    });
  },
});
