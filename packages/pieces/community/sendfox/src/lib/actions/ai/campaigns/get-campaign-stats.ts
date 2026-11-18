import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import { sendfoxGetCampaignStatsOutputSchema } from '../../../output-schemas';

const BOOLEAN_OPTIONS = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export const getCampaignStatsAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_get_campaign_stats',
  outputSchema: sendfoxGetCampaignStatsOutputSchema,
  displayName: 'Get Campaign Stats',
  description: 'Get performance stats for one SendFox campaign',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one campaign\'s sent, open, click, unsubscribe, bounce and spam counts and rates, and optionally clicks per link. Use List Campaign Stats for several campaigns at once. Campaign IDs come from List Campaigns.',
    idempotent: true,
  },
  props: {
    campaignId: sendfoxAiProps.campaignId({ required: true }),
    includeLinkStats: Property.StaticDropdown({
      displayName: 'Include Link Stats',
      description: '"true" adds clicks per link. Leave empty for SendFox\'s default.',
      required: false,
      options: { options: BOOLEAN_OPTIONS },
    }),
    linkLimit: Property.Number({
      displayName: 'Link Limit',
      description: 'Most links to include in the link stats.',
      required: false,
    }),
  },
  async run(context) {
    const { campaignId, includeLinkStats, linkLimit } = context.propsValue;
    return await sendfoxClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/campaigns/${encodeURIComponent(campaignId)}/stats`,
      query: {
        ...(includeLinkStats ? { include_link_stats: includeLinkStats } : {}),
        ...(linkLimit !== undefined ? { link_limit: String(linkLimit) } : {}),
      },
    });
  },
});
