const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function fetchGainsProtocol(): Promise<any> {
  const response = await fetch(`${DEFILLAMA_BASE}/protocol/gains-network`);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGnsPrice(): Promise<any> {
  const url = `${COINGECKO_BASE}/simple/price?ids=gains-network&vs_currencies=usd,btc&include_24hr_change=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
