import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics for Fraxtal including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/fraxtal',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<Record<string, number>> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const latestTvl = tvlArr && tvlArr.length > 0
      ? tvlArr[tvlArr.length - 1]['totalLiquidityUSD']
      : null;

    const chains = chainTvls ? Object.keys(chainTvls) : [];

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains,
      chain_count: chains.length,
      current_tvl_usd: latestTvl,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
    };
  },
});
