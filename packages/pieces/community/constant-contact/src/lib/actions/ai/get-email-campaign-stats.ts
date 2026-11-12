import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { ccData } from '../../common/types';
import { campaignStatsOutputSchema } from '../../common/output-schemas';

export const getEmailCampaignStatsAiAction = createAction({
  auth: constantContactAuth,
  name: 'get_email_campaign_stats_ai',
  classification: 'READ',
  displayName: 'Get Email Campaign Stats',
  description: 'Gets send, open, click, bounce and unsubscribe counts for campaigns.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets performance counts and percentages (sends, opens, clicks, bounces, unsubscribes) for 1-10 Constant Contact email campaigns by campaign_id. Drafts that were never sent have no stats. Needs the campaign_data permission.',
    idempotent: true,
  },
  outputSchema: campaignStatsOutputSchema,
  props: {
    campaign_ids: aiProps.text({ displayName: 'Campaign IDs', description: 'Comma-separated campaign IDs, 1 to 10.', required: true }),
  },
  async run({ auth, propsValue }) {
    const ids = ccInput.idList({ value: propsValue.campaign_ids, label: 'Campaign IDs', max: 10, required: true });
    const response = await ccClient.request({
      accessToken: auth.access_token,
      method: 'GET',
      path: `/reports/stats/email_campaigns/${ids.map((id) => ccClient.segment(id)).join(',')}`,
      operation: 'get email campaign stats',
      requiredScope: 'campaign_data',
    });
    return { results: ccData.recordsAt({ value: response.body, key: 'results' }), errors: ccData.recordsAt({ value: response.body, key: 'errors' }) };
  },
});
