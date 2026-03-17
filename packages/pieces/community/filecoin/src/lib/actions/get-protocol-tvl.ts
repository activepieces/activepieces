import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Filecoin total value locked with percentage changes',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/v2/chains');
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    const chains = await response.json();
    const filecoin = chains.find((c: { name: string }) => c.name === 'Filecoin');
    if (!filecoin) throw new Error('Filecoin chain not found');
    return {
      name: 'Filecoin',
      tvl: filecoin.tvl,
      tokenSymbol: filecoin.tokenSymbol,
      chainId: filecoin.chainId,
    };
  },
});
