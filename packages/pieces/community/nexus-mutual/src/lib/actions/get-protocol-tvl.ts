import { createAction, Property } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Nexus Mutual total value locked (TVL) from DeFiLlama',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/nexus-mutual');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const tvl = data.currentChainTvls
      ? Object.values(data.currentChainTvls as Record<string, number>).reduce(
          (sum: number, v: number) => sum + v,
          0
        )
      : data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD ?? null;

    return {
      name: data.name,
      symbol: data.symbol,
      tvl_usd: tvl,
      category: data.category,
      chains: data.chains,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      fetched_at: new Date().toISOString(),
    };
  },
});
