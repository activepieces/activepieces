const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const DEFILLAMA_SLUG = 'compound-v3';
const COINGECKO_ID = 'compound-governance-token';

export interface ProtocolTVLResponse {
  id: string;
  name: string;
  symbol: string;
  description: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  chains: string[];
  url: string;
  logo: string;
}

export interface ChainTVLBreakdown {
  chain: string;
  tvl: number;
}

export interface TVLHistoryPoint {
  date: number;
  tvl: number;
}

export interface CoinGeckoTokenData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  atl: number;
  last_updated: string;
}

export async function getProtocolTVL(): Promise<ProtocolTVLResponse> {
  const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    symbol: data.symbol,
    description: data.description,
    tvl: data.currentChainTvls ? Object.values(data.currentChainTvls as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : data.tvl,
    change_1h: data.change_1h ?? null,
    change_1d: data.change_1d ?? null,
    change_7d: data.change_7d ?? null,
    chains: data.chains ?? [],
    url: data.url ?? '',
    logo: data.logo ?? '',
  };
}

export async function getChainBreakdown(): Promise<ChainTVLBreakdown[]> {
  const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const chainTvls: Record<string, number> = data.currentChainTvls ?? {};
  return Object.entries(chainTvls).map(([chain, tvl]) => ({ chain, tvl }));
}

export async function getTVLHistory(limit?: number): Promise<TVLHistoryPoint[]> {
  const response = await fetch(`${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const tvlData: TVLHistoryPoint[] = (data.tvl ?? []).map((point: { date: number; totalLiquidityUSD: number }) => ({
    date: point.date,
    tvl: point.totalLiquidityUSD,
  }));
  if (limit && limit > 0) {
    return tvlData.slice(-limit);
  }
  return tvlData;
}

export async function getTokenPrice(): Promise<CoinGeckoTokenData> {
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&ids=${COINGECKO_ID}&price_change_percentage=24h,7d`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error('No token data found from CoinGecko');
  }
  const token = data[0];
  return {
    id: token.id,
    symbol: token.symbol?.toUpperCase(),
    name: token.name,
    current_price: token.current_price,
    market_cap: token.market_cap,
    total_volume: token.total_volume,
    price_change_percentage_24h: token.price_change_percentage_24h,
    price_change_percentage_7d: token.price_change_percentage_7d_in_currency,
    circulating_supply: token.circulating_supply,
    total_supply: token.total_supply,
    max_supply: token.max_supply,
    ath: token.ath,
    atl: token.atl,
    last_updated: token.last_updated,
  };
}
