import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetches key statistics for the Stride protocol including TVL, category, chains, and audit info from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/stride',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlHistory && tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD : null;
    const prevTvl = tvlHistory && tvlHistory.length > 1 ? tvlHistory[tvlHistory.length - 2]?.totalLiquidityUSD : null;
    const tvlChange = latestTvl && prevTvl ? ((latestTvl - prevTvl) / prevTvl) * 100 : null;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      current_tvl_usd: latestTvl,
      tvl_change_24h_pct: tvlChange ? parseFloat(tvlChange.toFixed(2)) : null,
      audits: data['audits'],
      audit_links: data['audit_links'],
      github: data['github'],
      twitter: data['twitter'],
      url: data['url'],
    };
  },
});
