import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../fantom-api';

interface FantomProtocolFull {
  id: string;
  name: string;
  symbol: string;
  tvl: number;
  chainTvls: Record<string, number>;
  chains: string[];
  category: string;
  description: string;
  url: string;
  twitter: string;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  listedAt: number;
  mcap: number;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key Fantom protocol statistics including TVL, supported chains, category, and market cap from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<FantomProtocolFull>('/protocol/fantom');

    const chainCount = data.chains ? data.chains.length : 0;
    const chainTvls = data.chainTvls || {};
    const topChain = Object.entries(chainTvls).sort(([, a], [, b]) => b - a)[0];

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      tvl_usd: data.tvl,
      market_cap_usd: data.mcap,
      chain_count: chainCount,
      chains: data.chains,
      top_chain: topChain ? { chain: topChain[0], tvl: topChain[1] } : null,
      tvl_change_1h_pct: data.change_1h,
      tvl_change_1d_pct: data.change_1d,
      tvl_change_7d_pct: data.change_7d,
      listed_at: data.listedAt ? new Date(data.listedAt * 1000).toISOString() : null,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
