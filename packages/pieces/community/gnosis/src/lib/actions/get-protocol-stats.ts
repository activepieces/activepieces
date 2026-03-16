import { createAction } from '@activepieces/pieces-framework';
import { llamaGet, GNOSIS_PROTOCOL_SLUG } from '../gnosis-api';

interface ProtocolData {
  name?: string;
  symbol?: string;
  category?: string;
  chains?: string[];
  tvl?: number;
  currentChainTvls?: Record<string, number>;
  description?: string;
  url?: string;
  twitter?: string;
  gecko_id?: string;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key Gnosis Chain protocol stats from DeFiLlama: total TVL, supported chains, category, and metadata.',
  props: {},
  async run() {
    const data = await llamaGet<ProtocolData>(`/protocol/${GNOSIS_PROTOCOL_SLUG}`);
    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      chains: data.chains ?? [],
      chain_count: (data.chains ?? []).length,
      total_tvl_usd: data.tvl,
      tvl_by_chain: data.currentChainTvls ?? {},
      description: data.description,
      url: data.url,
      twitter: data.twitter,
      coingecko_id: data.gecko_id,
    };
  },
});
