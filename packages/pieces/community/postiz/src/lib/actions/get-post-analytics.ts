import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall } from '../common';

export const getPostAnalytics = createAction({
  auth: postizAuth,
  name: 'get_post_analytics',
  displayName: 'Get Post Analytics',
  description:
    'Retrieve analytics (likes, comments, shares, impressions) for a specific published post',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves engagement analytics (likes, comments, shares, impressions and their change) for a single published post over a configurable lookback window in days. Use to measure how one specific post performed. Requires the post ID (from List Posts or the New Published Post trigger). Idempotent — a read-only lookup.',
    idempotent: true,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description:
        'The ID of the published post. You can get this from the "List Posts" or "New Published Post" trigger output.',
      required: true,
    }),
    days: Property.Number({
      displayName: 'Lookback Days',
      description: 'Number of days to look back for analytics (e.g. 7, 30, 90)',
      required: true,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<
      {
        label: string;
        total: number;
        percentageChange: number;
        data: { date: string; total: number }[];
      }[]
    >({
      auth,
      method: HttpMethod.GET,
      path: `/analytics/post/${context.propsValue.postId}`,
      queryParams: {
        date: String(context.propsValue.days),
      },
    });

    return response.body.map((metric) => ({
      metric: metric.label,
      total: metric.total,
      percentage_change: metric.percentageChange,
      daily_data: metric.data
        ?.map((d) => `${d.date}:${d.total}`)
        .join(', ') ?? null,
    }));
  },
});
