import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Bifrost Finance including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/bifrost-finance',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = (data['chainTvls'] ?? {}) as Record<string, unknown>;
    const chains = Object.keys(chainTvls).filter(
      (c) => !c.includes('-') // exclude sub-keys like "Polkadot-staking"
    );

    const tvlArr = (data['tvl'] ?? []) as Array<Record<string, number>>;
    const currentTvl =
      tvlArr.length > 0
        ? tvlArr[tvlArr.length - 1]['totalLiquidityUSD']
        : null;

    const prevEntry = tvlArr.length > 1 ? tvlArr[tvlArr.length - 2] : null;
    const tvlChange24h =
      currentTvl && prevEntry
        ? ((currentTvl - prevEntry['totalLiquidityUSD']) /
            prevEntry['totalLiquidityUSD']) *
          100
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      current_tvl_usd: currentTvl,
      tvl_change_24h_percent: tvlChange24h
        ? Math.round(tvlChange24h * 100) / 100
        : null,
      chains,
      total_chains: chains.length,
      url: data['url'],
      description: data['description'],
    };
  },
});
