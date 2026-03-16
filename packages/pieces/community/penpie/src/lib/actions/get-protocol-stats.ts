import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key Penpie protocol statistics including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/penpie',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const currentTvl = tvlArray?.at(-1)?.totalLiquidityUSD ?? 0;
    const chains = data['chains'] as string[] | undefined ?? [];

    const allTvlValues = (tvlArray ?? []).map((e) => e.totalLiquidityUSD);
    const maxTvl = allTvlValues.length > 0 ? Math.max(...allTvlValues) : 0;
    const minTvl = allTvlValues.length > 0 ? Math.min(...allTvlValues) : 0;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      currentTvlUsd: currentTvl,
      chains,
      chainCount: chains.length,
      supportedChainKeys: chainTvls ? Object.keys(chainTvls) : [],
      allTimehighTvlUsd: maxTvl,
      allTimeLowTvlUsd: minTvl,
      url: data['url'],
      twitter: data['twitter'],
      audit_links: data['audit_links'],
    };
  },
});
