import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Origin Protocol total value locked (TVL) from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/origin-protocol');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const tvl = data.tvl ?? [];
    const latestTvl = tvl.length > 0 ? tvl[tvl.length - 1] : null;

    return {
      name: data.name,
      symbol: data.symbol,
      currentTvl: latestTvl ? latestTvl.totalLiquidityUSD : null,
      tvlTimestamp: latestTvl ? new Date(latestTvl.date * 1000).toISOString() : null,
      category: data.category,
      chains: data.chains,
      description: data.description,
      url: data.url,
    };
  },
});
