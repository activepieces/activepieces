import { createAction, Property } from '@activepieces/pieces-framework';
import { aaveAuth } from '../aave-auth';
import { getRateHistory } from '../aave-api';

export const getRateHistoryAction = createAction({
  auth: aaveAuth,
  name: 'get_rate_history',
  displayName: 'Get Rate History',
  description:
    'Fetch historical interest rate data (supply APY, borrow APY, utilization rate) for a specific Aave V3 reserve.',
  props: {
    reserve_id: Property.ShortText({
      displayName: 'Reserve ID',
      description:
        'The Aave reserve ID. This is typically the underlying asset address concatenated with the pool address. You can find it in the reserve data returned by "Get Reserves" (the `id` field).',
      required: true,
    }),
    from_date: Property.DateTime({
      displayName: 'From Date',
      description:
        'Start date for the historical data range. Defaults to 30 days ago if not set.',
      required: false,
    }),
    resolution_hours: Property.Number({
      displayName: 'Resolution (hours)',
      description:
        'Data point resolution in hours. Use 1 for hourly, 24 for daily. Default: 24.',
      required: false,
      defaultValue: 24,
    }),
  },
  async run(context) {
    const { reserve_id, from_date, resolution_hours } = context.propsValue;

    let fromTimestamp: number;
    if (from_date) {
      fromTimestamp = Math.floor(new Date(from_date).getTime() / 1000);
    } else {
      // Default to 30 days ago
      fromTimestamp = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    }

    const resolutionHours =
      typeof resolution_hours === 'number' && resolution_hours > 0
        ? resolution_hours
        : 24;

    const history = await getRateHistory(
      reserve_id,
      fromTimestamp,
      resolutionHours
    );

    return {
      reserveId: reserve_id,
      fromTimestamp,
      resolutionInHours: resolutionHours,
      dataPoints: Array.isArray(history) ? history.length : 0,
      history,
    };
  },
});
