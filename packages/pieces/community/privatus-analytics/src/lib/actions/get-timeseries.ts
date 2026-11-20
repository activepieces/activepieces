import { createAction, Property } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { PeriodInfo, privatusApiCall, segment } from '../common/client';
import { periodProps, periodQuery, siteDropdown } from '../common/props';

type TimeseriesResponse = {
  period: PeriodInfo;
  interval: string;
  series: Array<Record<string, string | number | null>>;
};

export const getTimeseriesAction = createAction({
  auth: privatusAnalyticsAuth,
  name: 'get_timeseries',
  classification: 'READ',
  displayName: 'Get Visitors Over Time',
  description:
    'Gets visitors, visits and pageviews for each hour, day, week or month of a period, one row per step.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the metrics of one website per time bucket (visitors, visits, pageviews, views per visit, bounce rate, visit duration, revenue) for a date range, one row per bucket. Use to see a trend or fill a chart or sheet; use Get Stats for totals. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    site_id: siteDropdown,
    ...periodProps,
    interval: Property.StaticDropdown({
      displayName: 'Step',
      description: 'How long each row is. **Auto** picks one that fits the period.',
      required: false,
      defaultValue: 'auto',
      options: {
        disabled: false,
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Hour', value: 'hour' },
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const data = await privatusApiCall<TimeseriesResponse>({
      token: auth.secret_text,
      path: `/sites/${segment(propsValue.site_id)}/stats/timeseries.json`,
      queryParams: {
        ...periodQuery(propsValue),
        interval: propsValue.interval ?? 'auto',
      },
    });
    return (data.series ?? []).map((point) => ({
      interval: data.interval,
      ...point,
    }));
  },
});
