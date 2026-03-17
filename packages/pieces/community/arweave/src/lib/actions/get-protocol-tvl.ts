import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Arweave chain total value locked',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/v2/chains');
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    const chains = await response.json();
    const chain = chains.find((c: { name: string }) => c.name === 'Arweave');
    if (!chain) throw new Error('Arweave chain not found');
    return { name: 'Arweave', tvl: chain.tvl, tokenSymbol: chain.tokenSymbol };
  },
});
