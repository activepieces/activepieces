const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface ProtocolData {
  id: string;
  name: string;
  address: string | null;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_note: string | null;
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  tvlPrevDay: number;
  tvlPrevWeek: number;
  tvlPrevMonth: number;
  mcap: number;
}

export interface TvlHistoryPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface PicklePrice {
  usd: number;
  btc: number;
  usd_24h_change: number;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number; btc: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number;
    ath: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
  };
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json() as Promise<T>;
}

export async function getProtocolTvl(): Promise<ProtocolData> {
  return apiFetch<ProtocolData>(`${DEFILLAMA_BASE}/protocol/pickle`);
}

export async function getPicklePrice(): Promise<PicklePrice> {
  const data = await apiFetch<{ 'pickle-finance': PicklePrice }>(
    `${COINGECKO_BASE}/simple/price?ids=pickle-finance&vs_currencies=usd,btc&include_24hr_change=true`
  );
  return data['pickle-finance'];
}

export async function getTvlHistory(): Promise<TvlHistoryPoint[]> {
  const protocol = await apiFetch<{ tvl: TvlHistoryPoint[] }>(`${DEFILLAMA_BASE}/protocol/pickle`);
  return protocol.tvl ?? [];
}

export async function getChainBreakdown(): Promise<Record<string, number>> {
  const protocol = await getProtocolTvl();
  return protocol.chainTvls ?? {};
}

export async function getCoinMarketData(): Promise<CoinMarketData> {
  return apiFetch<CoinMarketData>(
    `${COINGECKO_BASE}/coins/pickle-finance?localization=false&tickers=false&community_data=false&developer_data=false`
  );
}
