const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function getProtocolTvl(): Promise<any> {
  const res = await fetch(`${DEFILLAMA_BASE}/protocol/abracadabra`);
  if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
  const data = await res.json();
  return {
    name: data.name,
    tvl: data.tvl,
    currentTvl: data.currentChainTvls,
    category: data.category,
    description: data.description,
    url: data.url,
    twitter: data.twitter,
    chains: data.chains,
    audits: data.audits,
  };
}

export async function getSpellPrice(): Promise<any> {
  const res = await fetch(
    `${COINGECKO_BASE}/simple/price?ids=spell-token&vs_currencies=usd,btc&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const data = await res.json();
  const spell = data['spell-token'];
  return {
    usd: spell.usd,
    btc: spell.btc,
    usd_24h_change: spell.usd_24h_change,
    btc_24h_change: spell.btc_24h_change,
  };
}

export async function getMimPeg(): Promise<any> {
  const res = await fetch(
    `${COINGECKO_BASE}/simple/price?ids=magic-internet-money&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
  const data = await res.json();
  const mim = data['magic-internet-money'];
  const pegDeviation = Math.abs(mim.usd - 1.0);
  const pegDeviationPercent = (pegDeviation / 1.0) * 100;
  return {
    usd: mim.usd,
    usd_24h_change: mim.usd_24h_change,
    peg_target: 1.0,
    peg_deviation: pegDeviation,
    peg_deviation_percent: pegDeviationPercent,
    is_pegged: pegDeviationPercent < 0.5,
    status: pegDeviationPercent < 0.1 ? 'stable' : pegDeviationPercent < 0.5 ? 'slight_deviation' : 'depegged',
  };
}

export async function getChainBreakdown(): Promise<any> {
  const res = await fetch(`${DEFILLAMA_BASE}/protocol/abracadabra`);
  if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
  const data = await res.json();
  const chainTvls = data.currentChainTvls || {};
  const breakdown = Object.entries(chainTvls)
    .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
    .sort((a, b) => b.tvl - a.tvl);
  return {
    chains: breakdown,
    total_chains: breakdown.length,
    total_tvl: breakdown.reduce((sum, c) => sum + c.tvl, 0),
  };
}

export async function getTvlHistory(): Promise<any> {
  const res = await fetch(`${DEFILLAMA_BASE}/protocol/abracadabra`);
  if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`);
  const data = await res.json();
  const tvlHistory = (data.tvl || []).slice(-30).map((entry: any) => ({
    date: new Date(entry.date * 1000).toISOString().split('T')[0],
    tvl: entry.totalLiquidityUSD,
  }));
  return {
    history: tvlHistory,
    days_returned: tvlHistory.length,
    latest_tvl: tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1].tvl : null,
  };
}
