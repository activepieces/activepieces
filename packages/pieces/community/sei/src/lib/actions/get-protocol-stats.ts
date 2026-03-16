import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the Sei Network protocol from DeFiLlama, including TVL, chains, and category.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sei',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((acc, val) => acc + val, 0)
      : (data['tvl'] as number | undefined);

    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const lastEntry = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : undefined;
    const prevEntry =
      tvlArr && tvlArr.length > 1 ? tvlArr[tvlArr.length - 2] : undefined;

    const tvlChange24h =
      lastEntry && prevEntry && prevEntry.totalLiquidityUSD > 0
        ? (
            ((lastEntry.totalLiquidityUSD - prevEntry.totalLiquidityUSD) /
              prevEntry.totalLiquidityUSD) *
            100
          ).toFixed(2)
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      chains: data['chains'],
      total_chains: Array.isArray(data['chains']) ? (data['chains'] as unknown[]).length : 0,
      total_tvl_usd: totalTvl,
      tvl_change_24h_percent: tvlChange24h ? parseFloat(tvlChange24h) : null,
      current_chain_tvls: currentChainTvls,
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
      cmc_id: data['cmcId'],
    };
  },
});
