import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const linkaCommon = {
  subscribeWebhook: async (
    eventName: string,
    baseUrl: string,
    apiKey: string,
    webhookUrl: string
  ) => {
    const request = {
      method: HttpMethod.POST,
      url: `${baseUrl}/api/services/Platform/Event/Subscribe`,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        eventName: eventName,
        targetUrl: webhookUrl,
      },
    };

    const res = await httpClient.sendRequest(request);

    const { id: webhookId } = res.body.result;

    return webhookId;
  },

  unsubscribeWebhook: async (
    baseUrl: string,
    apiKey: string,
    webhookId: number
  ) => {
    const request = {
      method: HttpMethod.POST,
      url: `${baseUrl}/api/services/Platform/Event/Unsubscribe?id=${webhookId}`,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    return await httpClient.sendRequest(request);
  },
};
