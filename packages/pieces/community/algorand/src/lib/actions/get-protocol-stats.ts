import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key Algorand protocol statistics from DeFiLlama: current TVL, category, chain list, and token info.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/algorand',
    });
    const data = response.body as Record<string, any>;
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data['tvl'] ?? [];
    const latestTvl =
      tvlArray.length > 0 ? tvlArray[tvlArray.length - 1]?.totalLiquidityUSD : null;
    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? data['chains'].length : 0,
      current_tvl_usd: latestTvl,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});
