import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { insightsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown, parseArrayProp } from '../../common';

export const getMediaInsights = createAction({
  auth: instagramCommon.authentication,
  outputSchema: insightsOutputSchema,
  name: 'get_media_insights',
  classification: 'READ',
  displayName: 'Get Media Insights',
  description: 'Read reach, likes and comments metrics for one post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads per-post Instagram metrics such as reach, likes, comments, saves and shares for one media id. Available metrics differ by media type, since reels and stories expose different ones from feed images, and an unsupported metric returns an error naming it. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'account',
      display: 'section',
      label: 'Account',
      icon: 'user',
      props: ['page'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Post',
      icon: 'file',
      props: ['media_id', 'metrics'],
    },
  ],
  props: {
    page: instagramCommon.page,
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'The id from List Media or a publish step.',
      placeholder: '17895695668004550',
      required: true,
    }),
    metrics: Property.Array({
      displayName: 'Metrics',
      description: 'For example reach or saved. Empty uses defaults for the post type.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const metrics = parseArrayProp(propsValue.metrics)
      .map((metric) => String(metric))
      .filter((metric) => metric.length > 0);

    const metric =
      metrics.length > 0
        ? metrics.join(',')
        : await defaultMetrics({ mediaId: propsValue.media_id, accessToken: page.accessToken });

    const response = await instagramCommon.graphRequest<{ data?: unknown[] }>({
      method: HttpMethod.GET,
      resourceUri: `/${propsValue.media_id}/insights`,
      accessToken: page.accessToken,
      query: { metric },
    });

    const insights = response.data ?? [];
    return { insights, count: insights.length };
  },
});

async function defaultMetrics({
  mediaId,
  accessToken,
}: {
  mediaId: string;
  accessToken: string;
}): Promise<string> {
  const media = await instagramCommon.graphRequest<{ media_product_type?: string }>({
    method: HttpMethod.GET,
    resourceUri: `/${mediaId}`,
    accessToken,
    query: { fields: 'media_product_type' },
  });
  return media.media_product_type === 'STORY' ? 'reach,replies,shares' : 'reach,likes,comments';
}
