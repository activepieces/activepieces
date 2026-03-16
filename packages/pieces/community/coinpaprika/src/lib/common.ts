export const COINPAPRIKA_BASE_URL = 'https://api.coinpaprika.com/v1';

export function buildAuthHeaders(
  apiKey: string | null | undefined
): Record<string, string> {
  if (apiKey && apiKey.trim().length > 0) {
    return { Authorization: `Bearer ${apiKey.trim()}` };
  }
  return {};
}
