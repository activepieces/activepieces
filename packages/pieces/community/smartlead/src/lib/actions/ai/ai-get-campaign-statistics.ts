import { createAction, Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../../auth';
import { smartleadOperations } from '../../common/operations';
import { smartleadOutputSchemas } from '../../common/output-schemas';

export const aiGetCampaignStatisticsAction = createAction({
  auth: smartleadAuth,
  name: 'ai_get_campaign_statistics',
  classification: 'READ',
  displayName: 'Get Campaign Statistics',
  description: 'Get analytics for a SmartLead campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns aggregate analytics for one SmartLead campaign by numeric campaign_id: sent, open, click, reply, bounce and unsubscribe counts plus lead status counts. Use List Campaigns to find the id. Read-only.',
    idempotent: true,
  },
  outputSchema: smartleadOutputSchemas.campaignStatistics,
  props: {
    campaign_id: Property.Number({ displayName: 'Campaign ID', description: 'Numeric SmartLead campaign ID (from List Campaigns).', required: true }),
  },
  async run({ auth, propsValue }) {
    return smartleadOperations.getCampaignStatistics({ apiKey: auth.secret_text, campaignId: propsValue.campaign_id });
  },
});
