import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

export const getCompanyStats = createAction({
  auth: produktlyAuth,
  name: 'get_company_stats',
  description: 'Get a company-wide statistics summary across all your Produktly features.',
  displayName: 'Get Company Stats',
  props: {
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Optional ISO 8601 date for the start of the period (e.g. 2024-01-01).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Optional ISO 8601 date for the end of the period (e.g. 2024-12-31).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.start_date) queryParams['startDate'] = propsValue.start_date;
    if (propsValue.end_date) queryParams['endDate'] = propsValue.end_date;
    const response = await produktlyApiCall<{
      period: { start: string; end: string; days: number; granularity: string };
      previousPeriod: { start: string; end: string };
      features: Array<{
        type: string;
        label: string;
        primary: { label: string; count: number; previousCount: number; changePct: number };
        secondary: { label: string; value: number; previousValue: number; changePp: number };
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/stats/summary',
      queryParams,
    });
    return {
      period_start: response.body.period.start,
      period_end: response.body.period.end,
      period_days: response.body.period.days,
      period_granularity: response.body.period.granularity,
      previous_period_start: response.body.previousPeriod.start,
      previous_period_end: response.body.previousPeriod.end,
      features: response.body.features.map((feature) => ({
        feature_type: feature.type,
        feature_label: feature.label,
        primary_label: feature.primary.label,
        primary_count: feature.primary.count,
        primary_previous_count: feature.primary.previousCount,
        primary_change_pct: feature.primary.changePct,
        secondary_label: feature.secondary.label,
        secondary_value: feature.secondary.value,
        secondary_previous_value: feature.secondary.previousValue,
        secondary_change_pp: feature.secondary.changePp,
      })),
    };
  },
});
