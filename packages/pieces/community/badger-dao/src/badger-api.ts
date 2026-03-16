const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

async function apiFetch(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json();
}

export async function getProtocolTvl(): Promise<any> {
  return apiFetch(`${DEFILLAMA_BASE}/protocol/badger-dao`);
}

export async function getBadgerPrice(): Promise<any> {
  return apiFetch(
    `${COINGECKO_BASE}/simple/price?ids=badger-dao&vs_currencies=usd,btc&include_24hr_change=true`
  );
}

export async function getDiggPrice(): Promise<any> {
  return apiFetch(
    `${COINGECKO_BASE}/simple/price?ids=digg&vs_currencies=usd,btc&include_24hr_change=true`
  );
}

export async function getTvlHistory(): Promise<any> {
  // Returns historical TVL data from the protocol endpoint
  const data = await apiFetch(`${DEFILLAMA_BASE}/protocol/badger-dao`);
  // tvl array contains { date, totalLiquidityUSD }
  if (data.tvl && Array.isArray(data.tvl)) {
    return data.tvl.slice(-30).map((entry: any) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));
  }
  return [];
}

export async function getChainBreakdown(): Promise<any> {
  const data = await apiFetch(`${DEFILLAMA_BASE}/protocol/badger-dao`);
  const chainTvls = data.chainTvls || {};
  const breakdown = Object.entries(chainTvls).map(([chain, info]: [string, any]) => ({
    chain,
    tvl:
      Array.isArray(info.tvl) && info.tvl.length > 0
        ? info.tvl[info.tvl.length - 1].totalLiquidityUSD
        : 0,
  }));
  breakdown.sort((a, b) => b.tvl - a.tvl);
  return breakdown;
}
