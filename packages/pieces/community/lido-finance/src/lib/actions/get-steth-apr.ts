import { createAction, Property } from '@activepieces/pieces-framework';
import { lidoApiGet, StethAprResponse } from '../lido-api';

export const getStethApr = createAction({
  name: 'get_steth_apr',
  displayName: 'Get stETH APR',
  description: 'Fetch the current stETH annual percentage rate (APR) from Lido Finance.',
  props: {},
  async run() {
    const response = await lidoApiGet<StethAprResponse>('/protocol/steth/apr/last');
    const aprs = response.data?.aprs ?? [];
    const latest = aprs[aprs.length - 1];
    return {
      apr: latest?.apr ?? null,
      timestamp: latest?.timeUnix ? new Date(latest.timeUnix * 1000).toISOString() : null,
      smaApr: response.data?.smaApr ?? null,
      symbol: response.meta?.symbol ?? 'stETH',
      chainId: response.meta?.chainId ?? 1,
      raw: response,
    };
  },
});
