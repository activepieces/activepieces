const DEFILLAMA_API_BASE = 'https://api.llama.fi';
const DEFILLAMA_COINS_BASE = 'https://coins.llama.fi';
const DEFILLAMA_YIELDS_BASE = 'https://yields.llama.fi';

export async function defillamaRequest<T>(
  url: string
): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `DefiLlama API error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

export function apiUrl(path: string): string {
  return `${DEFILLAMA_API_BASE}${path}`;
}

export function coinsUrl(path: string): string {
  return `${DEFILLAMA_COINS_BASE}${path}`;
}

export function yieldsUrl(path: string): string {
  return `${DEFILLAMA_YIELDS_BASE}${path}`;
}
