import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

export const stripeCommon = {
  baseUrl: 'https://api.stripe.com/v1',
  subscribeWebhook: async (
    eventNames: string[], // Changed from string to string[]
    webhookUrl: string,
    apiKey: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/webhook_endpoints`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        enabled_events: eventNames, // Use the array directly
        url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      queryParams: {},
    };

    const { body: webhook } = await httpClient.sendRequest<{ id: string }>(
      request
    );
    return webhook;
  },
  unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${stripeCommon.baseUrl}/webhook_endpoints/${webhookId}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    };
    return await httpClient.sendRequest(request);
  },
};