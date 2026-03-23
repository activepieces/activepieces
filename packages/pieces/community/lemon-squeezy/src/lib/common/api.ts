export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export function getLemonSqueezyHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
}
