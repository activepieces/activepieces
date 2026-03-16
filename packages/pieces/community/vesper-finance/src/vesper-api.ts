export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
export const VESPER_SLUG = 'vesper-finance';
export const VSP_COINGECKO_ID = 'vesper-finance';

export async function fetchVesperProtocol(): Promise<any> {
  const response = await fetch(`${DEFILLAMA_BASE}/protocol/${VESPER_SLUG}`);
  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchVspPrice(): Promise<any> {
  const url = `${COINGECKO_BASE}/simple/price?ids=${VSP_COINGECKO_ID}&vs_currencies=usd,btc&include_24hr_change=true`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
