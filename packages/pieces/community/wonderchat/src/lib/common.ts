export const WONDERCHAT_BASE_URL = 'https://app.wonderchat.io/api/v1/'; 

export function authHeader(apiKey: string | undefined) {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}