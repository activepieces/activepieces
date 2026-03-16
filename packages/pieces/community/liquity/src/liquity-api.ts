export async function getProtocolTvl(): Promise<{
  tvl: number;
  chainTvls: Record<string, number>;
  change_1d: number;
  change_7d: number;
}> {
  const res = await fetch('https://api.llama.fi/protocol/liquity');
  if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
  const data = await res.json();

  const currentTvl = data.currentChainTvls || {};
  const tvlArr: { date: number; totalLiquidityUSD: number }[] = data.tvl || [];
  const latest = tvlArr[tvlArr.length - 1]?.totalLiquidityUSD ?? 0;
  const prev1d = tvlArr[tvlArr.length - 2]?.totalLiquidityUSD ?? latest;
  const prev7d = tvlArr[tvlArr.length - 8]?.totalLiquidityUSD ?? latest;
  const change_1d = prev1d ? ((latest - prev1d) / prev1d) * 100 : 0;
  const change_7d = prev7d ? ((latest - prev7d) / prev7d) * 100 : 0;

  return {
    tvl: latest,
    chainTvls: currentTvl,
    change_1d: parseFloat(change_1d.toFixed(2)),
    change_7d: parseFloat(change_7d.toFixed(2)),
  };
}

export async function getLqtyPrice(): Promise<{
  usd: number;
  btc: number;
  usd_24h_change: number;
}> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=liquity&vs_currencies=usd,btc&include_24hr_change=true'
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const data = await res.json();
  const lqty = data['liquity'] || {};
  return {
    usd: lqty.usd ?? 0,
    btc: lqty.btc ?? 0,
    usd_24h_change: parseFloat((lqty.usd_24h_change ?? 0).toFixed(2)),
  };
}

export async function getLusdPrice(): Promise<{
  usd: number;
  usd_24h_change: number;
  peg_deviation: number;
}> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=liquity-usd&vs_currencies=usd&include_24hr_change=true'
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const data = await res.json();
  const lusd = data['liquity-usd'] || {};
  const usd = lusd.usd ?? 1;
  return {
    usd,
    usd_24h_change: parseFloat((lusd.usd_24h_change ?? 0).toFixed(4)),
    peg_deviation: parseFloat((usd - 1).toFixed(4)),
  };
}

export async function getTvlHistory(): Promise<
  { date: number; tvl: number }[]
> {
  const res = await fetch('https://api.llama.fi/protocol/liquity');
  if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
  const data = await res.json();
  const tvlArr: { date: number; totalLiquidityUSD: number }[] = data.tvl || [];
  return tvlArr.map((entry) => ({
    date: entry.date,
    tvl: entry.totalLiquidityUSD,
  }));
}

export async function getChainBreakdown(): Promise<
  { chain: string; tvl: number }[]
> {
  const res = await fetch('https://api.llama.fi/protocol/liquity');
  if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
  const data = await res.json();
  const chainTvls: Record<string, number> = data.currentChainTvls || {};
  return Object.entries(chainTvls).map(([chain, tvl]) => ({ chain, tvl }));
}
