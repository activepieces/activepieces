import { createAction, Property } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import {
  PeriodInfo,
  periodEndDate,
  periodStartDate,
  privatusApiCall,
  segment,
} from '../common/client';
import { periodProps, periodQuery, siteDropdown } from '../common/props';

type Metrics = Record<string, number | null>;

type AggregateResponse = {
  period: PeriodInfo;
  metrics: Metrics;
  comparison_period?: PeriodInfo;
  comparison?: Metrics;
  change?: Metrics;
};

const METRICS = [
  'visitors',
  'visits',
  'pageviews',
  'views_per_visit',
  'bounce_rate',
  'visit_duration',
  'revenue',
];

export const getStatsAction = createAction({
  auth: privatusAnalyticsAuth,
  name: 'get_stats',
  classification: 'READ',
  displayName: 'Get Stats',
  description:
    'Gets visitors, visits, pageviews, bounce rate and visit time of a site for a period, and how much they changed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the headline numbers of one website for a date range: visitors, visits, pageviews, views per visit, bounce rate, visit duration and revenue, optionally with the values and percent change of the previous period or year. Use for totals; use Get Visitors Over Time for a trend and Get Top Pages, Referrers and More for rankings. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    site_id: siteDropdown,
    ...periodProps,
    compare: Property.StaticDropdown({
      displayName: 'Compare With',
      description: 'Also get the numbers of an earlier period and the change in percent.',
      required: false,
      defaultValue: 'previous_period',
      options: {
        disabled: false,
        options: [
          { label: 'No comparison', value: 'none' },
          { label: 'The period before', value: 'previous_period' },
          { label: 'The same dates last year', value: 'previous_year' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const data = await privatusApiCall<AggregateResponse>({
      token: auth.secret_text,
      path: `/sites/${segment(propsValue.site_id)}/stats/aggregate.json`,
      queryParams: {
        ...periodQuery(propsValue),
        compare: propsValue.compare ?? 'previous_period',
      },
    });
    const result: Record<string, string | number | null> = {
      site_id: propsValue.site_id,
      date_from: periodStartDate(data.period),
      date_to: periodEndDate(data.period),
    };
    for (const metric of METRICS) {
      result[metric] = data.metrics?.[metric] ?? null;
    }
    if (data.comparison && data.comparison_period) {
      result['previous_date_from'] = periodStartDate(data.comparison_period);
      result['previous_date_to'] = periodEndDate(data.comparison_period);
      for (const metric of METRICS) {
        result[`previous_${metric}`] = data.comparison[metric] ?? null;
        result[`${metric}_change_percent`] = data.change?.[metric] ?? null;
      }
    }
    return result;
  },
});
