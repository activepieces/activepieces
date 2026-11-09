import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, sentCampaignId } from '../common/props';
import { campaignSummaryOutputSchema } from '../output-schemas';

export const getCampaignSummaryAction = createAction({
  auth: campaignMonitorAuth,
  name: 'get_campaign_summary',
  classification: 'READ',
  displayName: 'Get Campaign Summary',
  description: 'Returns the reporting summary of a sent campaign.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the reporting totals of one sent Campaign Monitor campaign: recipients, total and unique opens, clicks, unsubscribes, bounces, spam complaints, forwards, likes, mentions and the web version and Worldview links. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: campaignSummaryOutputSchema,
  props: {
    clientId: clientId,
    campaignId: sentCampaignId,
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/campaigns/${propsValue.campaignId}/summary.json`,
    });
    return response.body;
  },
});
