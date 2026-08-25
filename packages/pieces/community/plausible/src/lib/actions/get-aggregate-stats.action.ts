import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const getAggregateStats = createAction({
  name: 'get_aggregate_stats',
  auth: plausibleAuth,
  displayName: 'Get Aggregate Stats',
  description: 'Get aggregated analytics metrics for a time period',
  audience: 'both',
  aiMetadata: { description: 'Returns aggregated analytics metrics (such as visitors, pageviews, bounce rate, or visit duration) for a site over a preset time period like the last 7 or 30 days. Use for high-level totals across a window rather than per-dimension breakdowns. Requires a site and at least one metric; read-only and safe to repeat.', idempotent: true },
  props: {
    site_id: siteIdDropdown,
    period: Property.StaticDropdown({
      displayName: 'Period',
      required: true,
      options: {
        options: [
          { label: 'Today', value: 'day' },
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'This month', value: 'month' },
          { label: 'Last 6 months', value: '6mo' },
          { label: 'Last 12 months', value: '12mo' },
        ],
      },
    }),
    metrics: Property.StaticMultiSelectDropdown({
      displayName: 'Metrics',
      required: true,
      options: {
        options: [
          { label: 'Visitors', value: 'visitors' },
          { label: 'Pageviews', value: 'pageviews' },
          { label: 'Bounce Rate', value: 'bounce_rate' },
          { label: 'Visit Duration', value: 'visit_duration' },
          { label: 'Views Per Visit', value: 'views_per_visit' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const metricsStr = Array.isArray(propsValue.metrics)
      ? propsValue.metrics.join(',')
      : propsValue.metrics;
    const response = await plausibleApiCall<{
      results: Record<string, { value: number }>;
    }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      endpoint: '/stats/aggregate',
      queryParams: {
        site_id: propsValue.site_id,
        period: propsValue.period,
        metrics: metricsStr,
      },
    });
    return Object.fromEntries(
      Object.entries(response.results).map(([k, v]) => [k, v.value])
    );
  },
});
