import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the Linea protocol from DeFiLlama — including TVL, chains, category, and social links.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/linea',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const latestTvl = tvlArray && tvlArray.length > 0
      ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
      : null;

    const tvl7dAgo = tvlArray && tvlArray.length > 7
      ? tvlArray[tvlArray.length - 8].totalLiquidityUSD
      : null;

    const tvlChange7d = latestTvl && tvl7dAgo && tvl7dAgo !== 0
      ? ((latestTvl - tvl7dAgo) / tvl7dAgo) * 100
      : null;

    return {
      name: data['name'],
      description: data['description'],
      category: data['category'],
      chains: chains ?? [],
      chain_count: (chains ?? []).length,
      current_tvl_usd: latestTvl,
      current_chain_tvls: currentChainTvls ?? {},
      tvl_change_7d_percent: tvlChange7d ? Math.round(tvlChange7d * 100) / 100 : null,
      url: data['url'],
      twitter: data['twitter'],
      github: data['github'],
    };
  },
});
