export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export function getLemonSqueezyHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
}

/**
 * Builds a query string that preserves bracket characters in parameter names.
 * URLSearchParams percent-encodes brackets (e.g. filter[store_id] becomes
 * filter%5Bstore_id%5D), which some JSON:API servers reject.
 */
export function buildQueryString(params: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    parts.push(`${key}=${encodeURIComponent(value)}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
