import { createAction, Property } from '@activepieces/pieces-framework';
import { lidoApiGet, AprSmaResponse } from '../lido-api';

export const getAprHistory = createAction({
  name: 'get_apr_history',
  displayName: 'Get APR History',
  description: 'Fetch historical stETH APR data with simple moving average (SMA) from Lido Finance.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of APR data points to return (most recent first).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const response = await lidoApiGet<AprSmaResponse>('/protocol/steth/apr/sma');
    const aprs = (response.data?.aprs ?? []).map((entry) => ({
      apr: entry.apr,
      timestamp: new Date(entry.timeUnix * 1000).toISOString(),
    }));

    const limit = context.propsValue.limit ?? 30;
    const limited = aprs.slice(-limit).reverse();

    return {
      aprs: limited,
      smaApr: response.data?.smaApr ?? null,
      total: aprs.length,
      symbol: response.meta?.symbol ?? 'stETH',
    };
  },
});
