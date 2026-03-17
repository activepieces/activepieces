import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch StakeDAO total value locked (TVL) from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/stakedao');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentTvl: Array.isArray(data['tvl']) ? (data['tvl'] as {totalLiquidityUSD: number}[]).at(-1)?.totalLiquidityUSD : null,
      description: data['description'],
      category: data['category'],
      chains: data['chains'],
    };
  },
});
