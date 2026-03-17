import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Ribbon Finance total value locked (TVL) from DeFiLlama',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/ribbon-finance');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      currentChainTvls: data.currentChainTvls,
      mcap: data.mcap,
      category: data.category,
      description: data.description,
      url: data.url,
    };
  },
});
