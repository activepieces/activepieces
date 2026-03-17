import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>;
  tvlHistory: { date: number; totalLiquidityUSD: number }[];
}

export interface ChainTvlEntry {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryEntry {
  date: string;
  tvl: number;
}

export interface ProtocolTvlResult {
  name: string;
  tvl: number;
  chains: string[];
}

export interface RsEthPriceResult {
  price_usd: number;
  market_cap_usd: number | null;
  change_24h_percent: number | null;
}

export async function fetchKelpProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<{
    name: string;
    currentChainTvls: Record<string, number>;
    chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>;
    tvl: { date: number; totalLiquidityUSD: number }[];
  }>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/kelp-dao`,
  });

  const data = response.body;
  const currentChainTvls = data.currentChainTvls ?? {};
  const tvlValues = Object.values(currentChainTvls);
  const totalTvl = tvlValues.reduce((acc, v) => acc + v, 0);

  return {
    name: data.name,
    tvl: totalTvl,
    chains: Object.keys(currentChainTvls),
    chainTvls: data.chainTvls ?? {},
    tvlHistory: data.tvl ?? [],
  };
}

export async function fetchRsEthPrice(): Promise<RsEthPriceResult> {
  // Try multiple possible CoinGecko IDs for Kelp DAO / rsETH
  const ids = ['kelp-dao', 'restaked-eth', 'rseth'];

  for (const id of ids) {
    const response = await httpClient.sendRequest<
      Record<
        string,
        { usd?: number; usd_market_cap?: number; usd_24h_change?: number }
      >
    >({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE}/simple/price`,
      queryParams: {
        ids: id,
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });

    const data = response.body[id];
    if (data && data.usd !== undefined) {
      return {
        price_usd: data.usd,
        market_cap_usd: data.usd_market_cap ?? null,
        change_24h_percent: data.usd_24h_change ?? null,
      };
    }
  }

  throw new Error(
    'Unable to fetch rsETH price from CoinGecko. Token may not be listed or IDs have changed.'
  );
}

export function parseChainBreakdown(protocol: DefiLlamaProtocol): ChainTvlEntry[] {
  const chainTvls = protocol.chainTvls;
  const entries: { chain: string; tvl: number }[] = [];

  for (const [chain, data] of Object.entries(chainTvls)) {
    // Skip meta-entries like "borrowed", "staking" etc. that aren't actual chains
    if (chain.includes('-') && chain !== 'Ethereum') continue;
    const tvlArr = data.tvl;
    if (tvlArr && tvlArr.length > 0) {
      const latest = tvlArr[tvlArr.length - 1];
      entries.push({ chain, tvl: latest.totalLiquidityUSD });
    }
  }

  if (entries.length === 0) {
    // Fallback: use protocol.chains with overall tvl split equally
    const perChain = protocol.tvl / Math.max(protocol.chains.length, 1);
    return protocol.chains.map((chain) => ({
      chain,
      tvl: perChain,
      percentage: 100 / Math.max(protocol.chains.length, 1),
    }));
  }

  const total = entries.reduce((acc, e) => acc + e.tvl, 0);
  return entries
    .map((e) => ({
      chain: e.chain,
      tvl: e.tvl,
      percentage: total > 0 ? Number(((e.tvl / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.tvl - a.tvl);
}

export function parseTvlHistory(
  protocol: DefiLlamaProtocol,
  days: number
): { history: TvlHistoryEntry[]; change_percent: number | null; period_days: number } {
  const raw = protocol.tvlHistory;
  const sliced = raw.slice(-days);

  const history: TvlHistoryEntry[] = sliced.map((entry) => ({
    date: new Date(entry.date * 1000).toISOString().split('T')[0],
    tvl: entry.totalLiquidityUSD,
  }));

  let change_percent: number | null = null;
  if (history.length >= 2) {
    const first = history[0].tvl;
    const last = history[history.length - 1].tvl;
    if (first !== 0) {
      change_percent = Number((((last - first) / first) * 100).toFixed(2));
    }
  }

  return {
    history,
    change_percent,
    period_days: history.length,
  };
}
