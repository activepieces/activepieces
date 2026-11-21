import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, postizCommon, postizPath, requirePositiveInteger, requireText } from '../common';

export const getPlatformAnalytics = createAction({
  auth: postizAuth,
  name: 'get_platform_analytics',
  classification: 'READ',
  displayName: 'Get Platform Analytics',
  description:
    'Retrieve analytics (followers, impressions, engagement) for a connected channel',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves channel-level analytics (followers, impressions, engagement and their change) for a connected channel over a configurable lookback window in days. Use to report on overall account performance rather than a single post. Requires the channel integration id (resolve via List Channels). Idempotent — a read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    itemLabel: '{metric}',
    fields: [
      {
        key: 'metrics',
        label: 'Metrics',
        value: '',
        labelKey: 'metric',
        listItems: [
          { key: 'metric', label: 'Metric' },
          { key: 'total', label: 'Total', format: 'number' },
          { key: 'percentage_change', label: 'Percentage Change', format: 'number' },
          { key: 'daily_data', label: 'Daily Data' },
        ],
      },
    ],
  },
  props: {
    integration: postizCommon.integrationDropdown,
    days: Property.Number({
      displayName: 'Lookback Days',
      description: 'How many days back to read analytics for.',
      required: true,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const auth = context.auth;

    const response = await postizApiCall<
      {
        label: string;
        total: number;
        percentageChange: number;
        data: { date: string; total: number }[];
      }[]
    >({
      auth,
      method: HttpMethod.GET,
      path: postizPath({ segments: ['analytics', requireText({ value: context.propsValue.integration, label: 'Channel' })] }),
      queryParams: {
        date: String(requirePositiveInteger({ value: context.propsValue.days, label: 'Lookback Days' })),
      },
    });

    return (Array.isArray(response.body) ? response.body : []).map((metric) => ({
      metric: metric.label,
      total: metric.total,
      percentage_change: metric.percentageChange,
      daily_data: metric.data
        ?.map((d) => `${d.date}:${d.total}`)
        .join(', ') ?? null,
    }));
  },
});
