export const CHATWOOT_DEFAULT_BASE_URL = 'https://app.chatwoot.com';

export function chatwootEndpoints(baseUrl: string, accountId: number) {
  const base = (baseUrl ?? '').replace(/\/+$/, '');
  return {
    WEBHOOKS: `${base}/api/v1/accounts/${accountId}/webhooks`,
    WEBHOOK_BY_ID: (webhookId: number) =>
      `${base}/api/v1/accounts/${accountId}/webhooks/${webhookId}`,
    CONVERSATION_MESSAGES: (conversationId: number) =>
      `${base}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
    PROFILE: `${base}/auth/sign_in`,
  } as const;
}

export const CHATWOOT_AUTH_HEADER = 'api_access_token';
