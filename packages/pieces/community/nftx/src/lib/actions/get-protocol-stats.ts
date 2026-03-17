import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the NFTX protocol including TVL, supported chains, category, and audit info from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nftx',
    });
    const data = response.body;
    const tvlArray = data['tvl'] as TvlEntry[];
    const currentTvl = tvlArray?.slice(-1)[0]?.totalLiquidityUSD ?? 0;
    const tvl7dAgo = tvlArray?.slice(-8)[0]?.totalLiquidityUSD ?? 0;
    const tvl30dAgo = tvlArray?.slice(-31)[0]?.totalLiquidityUSD ?? 0;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      website: data['url'],
      twitter: data['twitter'],
      github: (data['github'] as string[]) ?? [],
      chains: data['chains'],
      chain_count: (data['chains'] as string[])?.length ?? 0,
      tvl: {
        current_usd: currentTvl,
        change_7d_pct:
          tvl7dAgo > 0
            ? Math.round(((currentTvl - tvl7dAgo) / tvl7dAgo) * 10000) / 100
            : null,
        change_30d_pct:
          tvl30dAgo > 0
            ? Math.round(((currentTvl - tvl30dAgo) / tvl30dAgo) * 10000) / 100
            : null,
      },
      audits: data['audits'],
      audit_links: data['audit_links'],
      forked_from: data['forkedFrom'],
      listed_at: data['listedAt']
        ? new Date((data['listedAt'] as number) * 1000).toISOString()
        : null,
    };
  },
});
