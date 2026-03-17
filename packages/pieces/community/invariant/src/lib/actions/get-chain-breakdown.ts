import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface ChainTvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  name: string;
  tvl: number;
  chainTvls: Record<string, { tvl: ChainTvlEntry[] }>;
  chains: string[];
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown by chain (Solana, Eclipse) for Invariant from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/invariant',
    });

    const data = response.body;
    const chainBreakdown: Record<string, number> = {};

    for (const [chain, chainData] of Object.entries(data.chainTvls)) {
      if (chainData.tvl && chainData.tvl.length > 0) {
        const latest = chainData.tvl[chainData.tvl.length - 1];
        chainBreakdown[chain] = latest.totalLiquidityUSD;
      }
    }

    return {
      protocol: 'Invariant',
      chains: data.chains,
      chain_tvl_breakdown_usd: chainBreakdown,
    };
  },
});
