import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Mango Markets total value locked (TVL) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/mango-markets');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }
    const data = await response.json();

    const totalTvl = data.currentChainTvls
      ? Object.values(data.currentChainTvls as Record<string, number>).reduce(
          (sum: number, v: number) => sum + v,
          0
        )
      : (data.tvl as Array<{ totalLiquidityUSD: number }> | undefined)?.slice(-1)[0]?.totalLiquidityUSD ?? 0;

    return {
      totalTvl,
      chainTvls: data.currentChainTvls ?? {},
      name: data.name ?? 'Mango Markets',
      symbol: data.symbol ?? 'MNGO',
      chain: data.chain ?? 'Solana',
    };
  },
});
