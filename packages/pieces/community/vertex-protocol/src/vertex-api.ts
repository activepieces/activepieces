const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function fetchVertexProtocol(): Promise<any> {
  const res = await fetch(`${DEFILLAMA_BASE}/protocol/vertex-protocol`);
  if (!res.ok) {
    throw new Error(`DeFiLlama API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVrtxPrice(): Promise<any> {
  const url = `${COINGECKO_BASE}/simple/price?ids=vertex-protocol-2&vs_currencies=usd,btc&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
