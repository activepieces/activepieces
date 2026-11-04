import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxClient } from '../../../common/client';
import { sendfoxListCampaignStatsOutputSchema } from '../../../output-schemas';

export const listCampaignStatsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_list_campaign_stats',
  outputSchema: sendfoxListCampaignStatsOutputSchema,
  displayName: 'List Campaign Stats',
  description: 'Get performance stats for several SendFox campaigns at once',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns sent, open, click, unsubscribe, bounce and spam counts and rates for 1 to 100 campaigns in one call. Use Get Campaign Stats for one campaign with its per-link clicks. Campaign IDs come from List Campaigns.',
    idempotent: true,
  },
  props: {
    campaignIds: Property.Array({
      displayName: 'Campaign IDs',
      description: '1 to 100 campaign IDs, e.g. ["1234567"]. Use List Campaigns to find them.',
      required: true,
    }),
  },
  async run(context) {
    const query = new URLSearchParams(
      context.propsValue.campaignIds.map((id) => ['campaign_ids[]', String(id)])
    );
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/campaigns/stats?${query.toString()}`,
    });
  },
});
