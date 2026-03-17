import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for the Umee protocol including TVL, category, chains, and description from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/umee',
    });
    const data = response.body as Record<string, any>;
    const tvlArray = (data['tvl'] as Array<{
      date: number;
      totalLiquidityUSD: number;
    }>) || [];
    const latestTvl =
      tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;
    const previousTvl =
      tvlArray.length > 1 ? tvlArray[tvlArray.length - 2] : null;
    const tvlChange24h =
      latestTvl && previousTvl
        ? ((latestTvl['totalLiquidityUSD'] - previousTvl['totalLiquidityUSD']) /
            previousTvl['totalLiquidityUSD']) *
          100
        : null;
    return {
      name: data['name'],
      symbol: data['symbol'],
      description: data['description'],
      category: data['category'],
      chains: data['chains'],
      current_tvl_usd: latestTvl ? latestTvl['totalLiquidityUSD'] : null,
      tvl_change_24h_percent:
        tvlChange24h !== null ? Math.round(tvlChange24h * 100) / 100 : null,
      gecko_id: data['gecko_id'],
      twitter: data['twitter'],
      audit_count: data['audits'] ? parseInt(data['audits'] as string) : null,
      listed_at: data['listedAt']
        ? new Date((data['listedAt'] as number) * 1000).toISOString()
        : null,
    };
  },
});
