import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, postizPath, requirePositiveInteger, requireText } from '../common';

export const getPostAnalytics = createAction({
  auth: postizAuth,
  name: 'get_post_analytics',
  classification: 'READ',
  displayName: 'Get Post Analytics',
  description:
    'Retrieve analytics (likes, comments, shares, impressions) for a specific published post',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves engagement analytics (likes, comments, shares, impressions and their change) for a single published post over a configurable lookback window in days. Use to measure how one specific post performed. Requires the post ID (from List Posts or the New Published Post trigger). Idempotent — a read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    itemLabel: '{metric}',
    fields: [
      {
        key: 'metrics',
        label: 'Metrics',
        value: '',
        labelKey: 'metric',
        listItems: [
          { key: 'metric', label: 'Metric' },
          { key: 'total', label: 'Total', format: 'number' },
          { key: 'percentage_change', label: 'Percentage Change', format: 'number' },
          { key: 'daily_data', label: 'Daily Data' },
        ],
      },
    ],
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'ID of the post, from List Posts or New Published Post.',
      required: true,
    }),
    days: Property.Number({
      displayName: 'Lookback Days',
      description: 'How many days back to read analytics for.',
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
      path: postizPath({ segments: ['analytics', 'post', requireText({ value: context.propsValue.postId, label: 'Post ID' })] }),
      queryParams: {
        date: String(requirePositiveInteger({ value: context.propsValue.days, label: 'Lookback Days' })),
      },
    });

    return (Array.isArray(response.body) ? response.body : []).map((metric) => ({
      metric: metric.label,
      total: metric.total,
      percentage_change: metric.percentageChange,
      daily_data: metric.data
        ?.map((d) => `${d.date}:${d.total}`)
        .join(', ') ?? null,
    }));
  },
});
