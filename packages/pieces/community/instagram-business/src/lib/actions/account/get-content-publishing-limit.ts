import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { getContentPublishingLimitOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const getContentPublishingLimit = createAction({
  auth: instagramCommon.authentication,
  outputSchema: getContentPublishingLimitOutputSchema,
  name: 'get_content_publishing_limit',
  classification: 'READ',
  displayName: 'Get Content Publishing Limit',
  description: 'Check how many posts the account has published in the last 24 hours.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads how much of the Instagram publishing quota the account has consumed in the rolling 24 hour window. Instagram allows 100 API-published posts per 24 hours, and a carousel counts as one. Call this before a batch of posts to avoid hitting the cap mid-run. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;

    const response = await instagramCommon.graphRequest<{
      data?: { quota_usage?: number; config?: { quota_total?: number; quota_duration?: number } }[];
    }>({
      method: HttpMethod.GET,
      resourceUri: `/${page.id}/content_publishing_limit`,
      accessToken: page.accessToken,
      query: { fields: 'config,quota_usage' },
    });

    const entry = response.data?.[0];
    const quotaUsage = entry?.quota_usage ?? 0;
    const quotaTotal = entry?.config?.quota_total ?? 100;

    return {
      quota_usage: quotaUsage,
      quota_total: quotaTotal,
      quota_remaining: Math.max(quotaTotal - quotaUsage, 0),
      quota_duration_seconds: entry?.config?.quota_duration,
    };
  },
});
