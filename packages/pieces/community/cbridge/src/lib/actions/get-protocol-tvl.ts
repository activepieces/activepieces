import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaGet, CBRIDGE_SLUG } from '../common/defillama-api';

interface ProtocolTvlResponse {
  id: string;
  name: string;
  symbol: string;
  description: string;
  tvl: number;
  currentChainTvls: Record<string, number>;
  [key: string]: unknown;
}

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Celer cBridge across all supported chains from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaGet<ProtocolTvlResponse>(
      `/protocol/${CBRIDGE_SLUG}`
    );
    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      tvl: data.tvl,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
