import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { insightsOutputSchema } from '../../output-schemas';
import { instagramCommon, FacebookPageDropdown } from '../../common';

export const getAccountInsights = createAction({
  auth: instagramCommon.authentication,
  outputSchema: insightsOutputSchema,
  name: 'get_account_insights',
  classification: 'READ',
  displayName: 'Get Account Insights',
  description: 'Read reach, views and interaction metrics for the account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads account-level Instagram metrics such as reach, profile views and accounts engaged, over a chosen period. Metrics cover professional accounts only and lag real time by a few hours, so a very recent post may not be reflected yet. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: instagramCommon.page,
    metrics: Property.Array({
      displayName: 'Metrics',
      description: 'Metric names, for example reach or profile_views. Defaults to reach.',
      required: false,
    }),
    period: Property.StaticDropdown({
      displayName: 'Period',
      required: false,
      defaultValue: 'day',
      options: {
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: '28 Days', value: 'days_28' },
          { label: 'Lifetime', value: 'lifetime' },
        ],
      },
    }),
  },
  async run({ propsValue }) {
    const page: FacebookPageDropdown = propsValue.page;
    const metrics = (propsValue.metrics ?? [])
      .map((metric) => String(metric))
      .filter((metric) => metric.length > 0);

    const response = await instagramCommon.graphRequest<{ data?: unknown[] }>({
      method: HttpMethod.GET,
      resourceUri: `/${page.id}/insights`,
      accessToken: page.accessToken,
      query: {
        metric: metrics.length > 0 ? metrics.join(',') : 'reach',
        period: propsValue.period ?? 'day',
        metric_type: 'total_value',
      },
    });

    const insights = response.data ?? [];
    return { insights, count: insights.length };
  },
});
