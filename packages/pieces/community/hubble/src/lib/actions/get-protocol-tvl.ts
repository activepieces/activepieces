import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Hubble Protocol from DeFiLlama.',
  auth: undefined,
  requireAuth: false,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      currentChainTvls: Record<string, number>;
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      name: string;
      symbol: string;
      category: string;
    }>({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE}/protocol/hubble`,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const tvlArray = data.tvl ?? [];
    const latest = tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      currentTvlUSD: latest ? latest.totalLiquidityUSD : null,
      currentChainTvls: data.currentChainTvls,
      dataPointCount: tvlArray.length,
    };
  },
});
