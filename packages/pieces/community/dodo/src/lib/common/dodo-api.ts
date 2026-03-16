export const DEFILLAMA_DODO_URL = 'https://api.llama.fi/protocol/dodo';
export const COINGECKO_DODO_URL = 'https://api.coingecko.com/api/v3/coins/dodo';

export async function fetchDefiLlama() {
  const response = await fetch(DEFILLAMA_DODO_URL);
  return response.json();
}

export async function fetchCoinGecko() {
  const response = await fetch(COINGECKO_DODO_URL);
  return response.json();
}