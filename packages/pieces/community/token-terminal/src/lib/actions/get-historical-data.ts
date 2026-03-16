import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokenTerminalAuth, makeRequest } from '../common/token-terminal-api';

export const getHistoricalData = createAction({
  auth: tokenTerminalAuth,
  name: 'getHistoricalData',
  displayName: 'Get Historical Data',
  description: 'Retrieve time-series historical metrics data for a specific protocol.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The unique identifier for the project (e.g. uniswap, aave, ethereum)',
      required: true,
    }),
    granularity: Property.StaticDropdown({
      displayName: 'Granularity',
      description: 'Time granularity for the historical data',
      required: false,
      defaultValue: 'daily',
      options: {
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
        ],
      },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date for historical data in YYYY-MM-DD format (optional)',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'End date for historical data in YYYY-MM-DD format (optional)',
      required: false,
    }),
    metric: Property.ShortText({
      displayName: 'Metric',
      description: 'Specific metric to retrieve (e.g. revenue, fees, tvl). Leave empty for all.',
      required: false,
    }),
  },
  async run(context) {
    const { project_id, granularity, start_date, end_date, metric } = context.propsValue;
    const queryParams: Record<string, string> = {
      granularity: (granularity as string) || 'daily',
    };
    if (start_date) queryParams['start_date'] = start_date as string;
    if (end_date) queryParams['end_date'] = end_date as string;
    if (metric) queryParams['metric'] = metric as string;
    return makeRequest(context.auth as string, HttpMethod.GET, `/projects/${project_id}/metrics`, queryParams);
  },
});
