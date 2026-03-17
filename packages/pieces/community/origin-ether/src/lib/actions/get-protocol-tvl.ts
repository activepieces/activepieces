import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData } from '../origin-ether-api';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Origin Ether protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchProtocolData();

    const latestEntry = data.tvl && data.tvl.length > 0
      ? data.tvl[data.tvl.length - 1]
      : null;

    return {
      name: data.name,
      symbol: data.symbol,
      tvlUsd: latestEntry?.totalLiquidityUSD ?? null,
      change1h: data.change_1h,
      change1d: data.change_1d,
      change7d: data.change_7d,
      chains: data.chains,
      category: data.category,
      url: data.url,
      fetchedAt: new Date().toISOString(),
    };
  },
});
