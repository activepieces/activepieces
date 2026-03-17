import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for Acala Network including TVL, chains, and category from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/acala',
    });
    const data = response.body as Record<string, unknown>;

    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl =
      tvlHistory && Array.isArray(tvlHistory) && tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as unknown[]).length : 0,
      current_tvl_usd: latestTvl,
      current_chain_tvls: data['currentChainTvls'],
      mcap: data['mcap'],
      slug: data['slug'],
      url: data['url'],
      twitter: data['twitter'],
      description: data['description'],
    };
  },
});
