import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown } from '../common/props';

export const domainStatisticsAction = createAction({
  auth: shortIoAuth,
  name: 'get-domain-statistics',
  displayName: 'Domain Statistics',
  description: 'Retrieve usage stats (clicks, conversions) for a domain within a time period.',
  props: {
    domainId: {
      ...domainIdDropdown,
      required: true,
      description: 'Select the domain to get statistics for',
    },
    period: Property.StaticDropdown({
      displayName: 'Time Period',
      description: 'Select a predefined time interval or choose "Custom" to set specific dates.',
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
          { label: 'Custom Date Range', value: 'custom' },
        ],
      },
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for statistics (required when period is "Custom").',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for statistics (required when period is "Custom").',
      required: false,
    }),
    tz: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone for statistics (e.g., UTC, America/New_York, Europe/London). Defaults to UTC.',
      required: false,
    }),
    clicksChartInterval: Property.StaticDropdown({
      displayName: 'Chart Interval',
      description: 'Granularity for click statistics chart data.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Hour', value: 'hour' },
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const { domainId: domainString, period, startDate, endDate, tz, clicksChartInterval } = propsValue;

    if (!domainString) {
      throw new Error('Domain is required. Please select a domain.');
    }

    const domainObject = JSON.parse(domainString as string);

    if (period === 'custom') {
      if (!startDate || !endDate) {
        throw new Error('Start Date and End Date are both required when using custom period.');
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        throw new Error('Start date must be before end date.');
      }
    }

    if (tz && tz.trim() !== '') {
      const tzValue = tz.trim();
      if (tzValue.length < 3 || tzValue.includes(' ')) {
        throw new Error('Invalid timezone format. Use standard timezone names like UTC, America/New_York, Europe/London.');
      }
    }

    const query: Record<string, string> = {
      period,
    };

    if (period === 'custom' && startDate && endDate) {
      query['startDate'] = new Date(startDate).toISOString().split('T')[0];
      query['endDate'] = new Date(endDate).toISOString().split('T')[0];
    }

    if (tz && tz.trim() !== '') query['tz'] = tz.trim();
    if (clicksChartInterval) query['clicksChartInterval'] = clicksChartInterval;

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.GET,
        auth,
        url: `https://statistics.short.io/statistics/domain/${domainObject.id}`,
        query,
      });

      const stats = response as any;
      const clicks = stats['clicks'] || 0;
      const links = stats['links'] || 0;
      const periodLabel = period === 'custom' ? 'custom period' : period.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

      return {
        success: true,
        message: `Retrieved statistics for ${periodLabel}: ${clicks} clicks across ${links} links`,
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your date range, timezone, and other settings.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API key and domain access.'
        );
      }
      
      if (error.message.includes('404')) {
        throw new Error(
          'Domain not found. Please verify the domain exists and you have access to its statistics.'
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to retrieve domain statistics: ${error.message}`);
    }
  },
});
