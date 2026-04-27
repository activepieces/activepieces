export const SMARTREACH_API_BASE = 'https://smartreach.io/api/v1';

export function getHeaders(apiKey: string) {
  return {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
