import { createAction } from '@activepieces/pieces-framework';
import { llamaGet, GNOSIS_PROTOCOL_SLUG } from '../gnosis-api';

interface ProtocolData {
  chainTvls?: Record<string, { tvl?: number; tokens?: unknown }>;
  currentChainTvls?: Record<string, number>;
  chains?: string[];
  tvl?: number;
}

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown by individual chain for the Gnosis protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await llamaGet<ProtocolData>(`/protocol/${GNOSIS_PROTOCOL_SLUG}`);
    return {
      chains: data.chains ?? [],
      currentChainTvls: data.currentChainTvls ?? {},
      chainTvlsBreakdown: data.chainTvls ?? {},
      totalTvl: data.tvl,
    };
  },
});
