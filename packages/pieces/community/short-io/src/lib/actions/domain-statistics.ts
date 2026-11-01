import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown } from '../common/props';
import { shortIoStats } from '../common/stats';

export const domainStatisticsAction = createAction({
  auth: shortIoAuth,
  name: 'get-domain-statistics',
  classification: 'READ',
  displayName: 'Domain Statistics',
  description: 'Retrieve usage stats (clicks, conversions) for a domain within a time period.',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves aggregate click and link statistics for a whole Short.io domain over a preset period (today, last 7/30 days, this/last month) or a custom start/end date. Custom range requires both dates. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.legacyDomainStats,
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
          { label: 'This Month', value: 'month' },
          { label: 'Last Month', value: 'lastmonth' },
          { label: 'All Time', value: 'total' },
          { label: 'Custom Date Range', value: 'custom' },
        ],
      },
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for statistics (required when period is "Custom"). The calendar day you pick is sent as is.',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for statistics (required when period is "Custom"). The calendar day you pick is sent as is.',
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
    const domain = shortIoLinks.parseDomainProp(propsValue.domainId);
    const stats = await shortIoStats.domainStatistics({
      auth,
      domainId: domain.id,
      period: propsValue.period,
      startDate: propsValue.startDate,
      endDate: propsValue.endDate,
      tz: propsValue.tz,
      clicksChartInterval: propsValue.clicksChartInterval,
      ignoreDatesForPresets: true,
    });
    const clicks = Number(stats['clicks'] ?? 0);
    const links = Number(stats['links'] ?? 0);
    return {
      success: true,
      message: `Retrieved statistics for ${propsValue.period}: ${clicks} clicks across ${links} links`,
      data: stats,
    };
  },
});
