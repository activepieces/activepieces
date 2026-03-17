import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';

interface ProtocolResponse {
  currentChainTvls: Record<string, number>;
  chainTvls: Record<
    string,
    {
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
    }
  >;
  name: string;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description:
    'Fetch the TVL breakdown by blockchain for Hubble Protocol from DeFiLlama.',
  auth: undefined,
  requireAuth: false,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE}/protocol/hubble`,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const currentChainTvls = data.currentChainTvls ?? {};

    const totalTvl = Object.values(currentChainTvls).reduce(
      (sum, v) => sum + v,
      0
    );

    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUSD: tvl,
      sharePct: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
    }));

    chains.sort((a, b) => b.tvlUSD - a.tvlUSD);

    return {
      protocol: data.name,
      totalTvlUSD: totalTvl,
      chainCount: chains.length,
      breakdown: chains,
    };
  },
});
