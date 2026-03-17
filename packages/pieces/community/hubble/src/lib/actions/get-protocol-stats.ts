import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  name: string;
  symbol: string;
  description: string;
  category: string;
  chains: string[];
  currentChainTvls: Record<string, number>;
  tvl: TvlDataPoint[];
  url: string;
  twitter: string;
  audit_links: string[];
  gecko_id: string;
}

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for Hubble Protocol from DeFiLlama: current TVL, chains, category, and metadata.',
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
    const tvlArray = data.tvl ?? [];
    const latest = tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;

    // 30-day change
    const cutoff = Math.floor(Date.now() / 1000) - 30 * 86400;
    const thirtyDaysAgo = tvlArray
      .filter((p) => p.date >= cutoff)
      .shift();

    const tvlNow = latest?.totalLiquidityUSD ?? null;
    const tvl30dAgo = thirtyDaysAgo?.totalLiquidityUSD ?? null;
    const tvlChange30dPct =
      tvlNow !== null && tvl30dAgo !== null && tvl30dAgo > 0
        ? parseFloat((((tvlNow - tvl30dAgo) / tvl30dAgo) * 100).toFixed(2))
        : null;

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      description: data.description ?? null,
      website: data.url ?? null,
      twitter: data.twitter ?? null,
      geckoId: data.gecko_id ?? null,
      chains: data.chains ?? [],
      chainCount: (data.chains ?? []).length,
      currentTvlUSD: tvlNow,
      tvlChange30dPct,
      currentChainTvls: data.currentChainTvls ?? {},
      auditLinks: data.audit_links ?? [],
    };
  },
});
