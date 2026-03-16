import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetches key statistics for the Socket Protocol including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/socket-protocol',
    });

    const data = response.body;
    const tvlHistory = (data['tvl'] as TvlDataPoint[] | undefined) ?? [];
    const currentChainTvls = data['currentChainTvls'] as
      | Record<string, number>
      | undefined;
    const chains = (data['chains'] as string[] | undefined) ?? [];

    const currentTvl =
      tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1].totalLiquidityUSD
        : 0;

    const totalTvlFromChains = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0)
      : currentTvl;

    return {
      name: data['name'],
      category: data['category'],
      url: data['url'],
      description: data['description'],
      current_tvl_usd: totalTvlFromChains,
      chains_count: chains.length,
      chains: chains,
      symbol: data['symbol'],
      twitter: data['twitter'],
      audits: data['audits'],
      mcap: data['mcap'],
    };
  },
});
