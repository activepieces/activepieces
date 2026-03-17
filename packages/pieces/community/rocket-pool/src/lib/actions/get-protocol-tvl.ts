import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../rocket-pool-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Rocket Pool from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchProtocol();
    const tvlHistory = data.tvl ?? [];
    const latest = tvlHistory[tvlHistory.length - 1];
    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      totalTvlUSD: latest?.totalLiquidityUSD ?? null,
      asOf: latest ? new Date(latest.date * 1000).toISOString() : null,
      currentChainTvls: data.currentChainTvls,
      category: data.category,
      chains: data.chains,
      url: data.url,
    };
  },
});
