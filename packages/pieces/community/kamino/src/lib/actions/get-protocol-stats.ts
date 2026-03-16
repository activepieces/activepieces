import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Kamino Finance including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      symbol: string;
      description: string;
      category: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      url: string;
      twitter: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kamino',
    });

    const data = response.body;
    const tvlArr = data.tvl || [];
    const latestTvl = tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : null;

    // Calculate 24h and 7d change
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;
    const sevenDaysAgo = now - 7 * 86400;

    const tvl24hEntry = tvlArr.filter((e) => e.date <= oneDayAgo).pop();
    const tvl7dEntry = tvlArr.filter((e) => e.date <= sevenDaysAgo).pop();

    const change24h = latestTvl && tvl24hEntry && tvl24hEntry.totalLiquidityUSD
      ? ((latestTvl - tvl24hEntry.totalLiquidityUSD) / tvl24hEntry.totalLiquidityUSD) * 100
      : null;

    const change7d = latestTvl && tvl7dEntry && tvl7dEntry.totalLiquidityUSD
      ? ((latestTvl - tvl7dEntry.totalLiquidityUSD) / tvl7dEntry.totalLiquidityUSD) * 100
      : null;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      chains: data.chains,
      chainCount: (data.chains || []).length,
      currentTvlUSD: latestTvl,
      tvlChange24hPercent: change24h !== null ? Math.round(change24h * 100) / 100 : null,
      tvlChange7dPercent: change7d !== null ? Math.round(change7d * 100) / 100 : null,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
