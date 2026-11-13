import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

export const getCampaignStats = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_campaign_stats',
  classification: 'READ',
  displayName: 'Get Campaign Stats',
  description: 'Gets delivery and engagement stats for a campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the totals for one Tarvent campaign by campaign ID: sent, delivered, opens, clicks, replies, bounces, opt-outs and spam complaints, with unique counts and percentages. Use Find Campaign to get the ID. Fails if the campaign does not exist. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.campaignStats,
  props: {
    campaignId: Property.ShortText({ displayName: 'Campaign ID', description: 'The campaign ID (from Find Campaign).', required: true }),
  },
  async run(context) {
    const id = tarventCommon.requireText({ value: context.propsValue.campaignId, label: 'Campaign ID' });
    return tarventTransport.field<Record<string, unknown>>({
      auth: context.auth.props,
      query: `query GetCampaignStats($input: CampaignStatsInput!) { campaignStats(input: $input) { ${tarventClient.fields.campaignStats} } }`,
      variables: { input: { id } },
      name: 'campaignStats',
    });
  },
});
