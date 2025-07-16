import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioCommon, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const domainStatistics = createAction({
  auth: shortioAuth,
  name: 'domain_statistics',
  displayName: 'Domain Statistics',
  description: 'Retrieve usage stats (clicks, conversions) for a domain within a time period.',
  props: {
    domain_id: shortioCommon.domain_id,
    period: Property.StaticDropdown({
      displayName: 'Period',
      description: 'Time period for statistics (defaults to last30)',
      required: false,
      defaultValue: 'last30',
      options: {
        options: [
          { label: 'Custom Period', value: 'custom' },
          { label: 'Today', value: 'today' },
          { label: 'Yesterday', value: 'yesterday' },
          { label: 'Total', value: 'total' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
          { label: 'Last Month', value: 'lastmonth' },
          { label: 'Last 7 Days', value: 'last7' },
          { label: 'Last 30 Days', value: 'last30' }
        ],
      },
    }),
    clicksChartInterval: Property.StaticDropdown({
      displayName: 'Clicks Chart Interval',
      description: 'Time interval for clicks chart data',
      required: false,
      options: {
        options: [
          { label: 'Hourly', value: 'hour' },
          { label: 'Daily', value: 'day' },
          { label: 'Weekly', value: 'week' },
          { label: 'Monthly', value: 'month' },
        ],
      },
    }),
    tz: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone for statistics (e.g. America/New_York)',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for custom period (required if period is custom)',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for custom period (required if period is custom)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const props = propsValue as any;
    
    const queryParams: Record<string, any> = {};

    const {
      period,
      clicksChartInterval,
      tz,
      startDate,
      endDate
    } = props;

    Object.assign(queryParams, {
      ...(period && { period }),
      ...(clicksChartInterval && { clicksChartInterval }),
      ...(tz && { tz }),
      ...(startDate && { 
        startDate: new Date(startDate).toISOString().split('T')[0]
      }),
      ...(endDate && {
        endDate: new Date(endDate).toISOString().split('T')[0] 
      })
    });

    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: `/statistics/domain/${props.domain_id}`,
      query: queryParams,
      hostName: "https://statistics.short.io",
    });

    return response;
  },
});
