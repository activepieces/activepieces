import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Tulip Protocol including TVL, category, chains, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tulip',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const latestTvl =
      tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : null;
    const prev7dEntry =
      tvlArr && tvlArr.length >= 8 ? tvlArr[tvlArr.length - 8] : null;
    const tvlChange7d =
      prev7dEntry && latestTvl !== null && prev7dEntry.totalLiquidityUSD !== 0
        ? parseFloat(
            (
              ((latestTvl - prev7dEntry.totalLiquidityUSD) /
                prev7dEntry.totalLiquidityUSD) *
              100
            ).toFixed(2)
          )
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      total_chains: Array.isArray(data['chains'])
        ? (data['chains'] as string[]).length
        : 0,
      current_tvl_usd: latestTvl,
      tvl_by_chain: currentChainTvls,
      tvl_change_7d_percent: tvlChange7d,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
    };
  },
});
