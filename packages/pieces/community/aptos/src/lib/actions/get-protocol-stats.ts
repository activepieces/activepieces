import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Retrieve key statistics for the Aptos protocol including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aptos',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as
      | { date: number; totalLiquidityUSD: number }[]
      | undefined;

    const currentTvl =
      Array.isArray(tvlArray) && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
        : null;

    const weekAgoTs = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const weekAgoEntry = Array.isArray(tvlArray)
      ? tvlArray.filter((e) => e.date <= weekAgoTs).slice(-1)[0]
      : null;

    const tvlChange7d =
      weekAgoEntry && currentTvl
        ? (((currentTvl - weekAgoEntry.totalLiquidityUSD) / weekAgoEntry.totalLiquidityUSD) * 100).toFixed(2)
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chainCount: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      currentTvlUsd: currentTvl,
      tvlChange7dPercent: tvlChange7d ? parseFloat(tvlChange7d) : null,
      description: data['description'],
      website: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
    };
  },
});
