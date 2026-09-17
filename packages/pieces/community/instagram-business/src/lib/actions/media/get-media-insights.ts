import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { insightsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const getMediaInsights = createAction({
  auth: instagramCommon.authentication,
  outputSchema: insightsOutputSchema,
  name: 'get_media_insights',
  classification: 'READ',
  displayName: 'Get Media Insights',
  description: 'Read reach, likes and comment metrics for one post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads per-post Instagram metrics such as reach, likes, comments, saves and shares for one media id. Available metrics differ by media type, since reels and stories expose different ones from feed images, and an unsupported metric returns an error naming it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({ displayName: 'Media ID', required: true }),
    metrics: Property.Array({
      displayName: 'Metrics',
      description: 'Metric names. Defaults to reach, likes and comments.',
      required: false,
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const metrics = (propsValue.metrics ?? [])
      .map((metric) => String(metric))
      .filter((metric) => metric.length > 0);

    const response = await instagramCommon.graphRequest<{ data?: unknown[] }>({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.media_id}/insights`,
      accessToken: page.accessToken,
      query: {
        metric: metrics.length > 0 ? metrics.join(',') : 'reach,likes,comments',
      },
    });

    const insights = response.data ?? [];
    return { insights, count: insights.length };
  },
});
