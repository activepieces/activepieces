import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Mode Network including TVL, chain count, category, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mode',
    });

    const data = response.body as Record<string, unknown>;
    const chains = (data['chains'] as string[]) || [];
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1]?.totalLiquidityUSD : 0;

    const audits = data['audits'] as string | undefined;
    const audit_links = data['audit_links'] as string[] | undefined;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      current_tvl_usd: latestTvl ?? 0,
      total_chains: chains.length,
      chains,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      audits: audits || 'N/A',
      audit_links: audit_links || [],
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
    };
  },
});
