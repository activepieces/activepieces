import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get top protocols by TVL built on Arweave',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocols');
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    const protocols = await response.json();
    const arweaveProtocols = protocols
      .filter((p: { chains: string[] }) => p.chains?.includes('Arweave'))
      .map((p: { name: string; tvl: number; category: string }) => ({
        name: p.name,
        tvl: p.tvl,
        category: p.category,
      }))
      .sort((a: { tvl: number }, b: { tvl: number }) => b.tvl - a.tvl)
      .slice(0, 20);
    return {
      protocols: arweaveProtocols,
      total: arweaveProtocols.reduce((sum: number, p: { tvl: number }) => sum + (p.tvl || 0), 0),
    };
  },
});
