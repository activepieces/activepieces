import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const getDomainStatisticsAction = createAction({
  auth: shortIoAuth,
  name: 'get-domain-statistics',
  displayName: 'Get Domain Statistics',
  description: 'Retrieve usage stats (clicks, conversions) for a domain within a selected time period.',
  props: {
    domainId: Property.Number({
      displayName: 'Domain ID',
      description: 'The ID of the domain whose statistics you want to retrieve.',
      required: true,
    }),
    period: Property.StaticDropdown({
      displayName: 'Period',
      description: 'Predefined time interval or "custom" to set start/end dates.',
      required: true,
      defaultValue: 'last30',
      options: {
        disabled: false,
        options: [
          { label: 'Today', value: 'today' },
          { label: 'Yesterday', value: 'yesterday' },
          { label: 'Last 7 Days', value: 'last7' },
          { label: 'Last 30 Days', value: 'last30' },
          { label: 'This Month', value: 'thisMonth' },
          { label: 'Last Month', value: 'lastMonth' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date in YYYY-MM-DD format (required for custom period).',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date in YYYY-MM-DD format (required for custom period).',
      required: false,
    }),
    tz: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone name (e.g., UTC, America/New_York). Defaults to UTC.',
      required: false,
    }),
    clicksChartInterval: Property.ShortText({
      displayName: 'Clicks Chart Interval',
      description: 'Optional chart interval (e.g., day, hour).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { domainId, period, startDate, endDate, tz, clicksChartInterval } = propsValue;

    const query: Record<string, string> = {
      period,
    };

    if (period === 'custom') {
      if (!startDate || !endDate) {
        throw new Error('Start Date and End Date are required when period is set to "custom".');
      }
      query['startDate'] = startDate;
      query['endDate'] = endDate;
    }

    if (tz) query['tz'] = tz;
    if (clicksChartInterval) query['clicksChartInterval'] = clicksChartInterval;

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        resourceUri: `/statistics/domain/${domainId}`,
        query,
      });

      return {
        success: true,
        message: 'Domain statistics retrieved successfully.',
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to retrieve domain statistics: ${error.message}`);
    }
  },
});
