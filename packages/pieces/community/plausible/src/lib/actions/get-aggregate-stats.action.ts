import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';

export const getAggregateStats = createAction({
  name: 'get_aggregate_stats',
  auth: plausibleAuth,
  displayName: 'Get Aggregate Stats',
  description: 'Get aggregated analytics metrics for a time period',
  props: {
    site_id: Property.ShortText({ displayName: 'Site Domain', required: true }),
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
    const metricsStr = Array.isArray(propsValue.metrics) ? propsValue.metrics.join(',') : propsValue.metrics;
    const params = new URLSearchParams({
      site_id: propsValue.site_id,
      period: propsValue.period,
      metrics: metricsStr,
    });
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://plausible.io/api/v1/stats/aggregate?${params}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    return response.body;
  },
});
