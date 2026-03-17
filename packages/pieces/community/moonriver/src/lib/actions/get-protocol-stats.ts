import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for Moonriver including TVL, supported chains, and category via DeFiLlama. No API key required.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/moonriver',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const chains = chainTvls ? Object.keys(chainTvls) : [];
    const tvlArr = data['tvl'] as
      | Array<{ date: number; totalLiquidityUSD: number }>
      | undefined;
    const currentTvl =
      tvlArr && tvlArr.length > 0
        ? tvlArr[tvlArr.length - 1].totalLiquidityUSD
        : 0;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      current_tvl_usd: currentTvl,
      supported_chains: chains,
      chain_count: chains.length,
      website: data['url'],
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
    };
  },
});
