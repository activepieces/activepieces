import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export type SetWebhookRequest = {
  ip_address: string;
  max_connections: number;
  allowed_updates: string[];
  drop_pending_updates: boolean;
  secret_token: string;
};

export const telegramCommons = {
  getApiUrl: (botToken: string, methodName: string) => {
    return `https://api.telegram.org/bot${botToken}/${methodName}`;
  },
  subscribeWebhook: async (
    botToken: string,
    webhookUrl: string,
    overrides?: Partial<SetWebhookRequest>
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.telegram.org/bot${botToken}/setWebhook`,
      body: {
        allowed_updates: [],
        url: webhookUrl,
        ...overrides,
      },
    };

    await httpClient.sendRequest(request);
  },
  unsubscribeWebhook: async (botToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.telegram.org/bot${botToken}/deleteWebhook`,
    };
    return await httpClient.sendRequest(request);
  },
};
