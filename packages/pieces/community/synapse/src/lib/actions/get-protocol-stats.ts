import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol stats for Synapse Protocol (TVL, chains, category) from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/synapse',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainCount = Object.keys(currentChainTvls ?? {}).length;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : null;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: chainCount,
      current_tvl_usd: latestTvl,
      url: data['url'],
      description: data['description'],
    };
  },
});
