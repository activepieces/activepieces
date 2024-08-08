import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const chargekeepCommon = {
  baseUrl: 'https://beta.chargekeep.com',
  subscribeWebhook: async (
    eventName: string,
    webhookUrl: string,
    apiKey: string
  ) => {
    const request = {
      method: HttpMethod.POST,
      url: `${chargekeepCommon.baseUrl}/api/services/Platform/Event/Subscribe`,
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

  unsubscribeWebhook: async (webhookId: number, apiKey: string) => {
    const request = {
      method: HttpMethod.POST,
      url: `${chargekeepCommon.baseUrl}/api/services/Platform/Event/Unsubscribe?id=${webhookId}`,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
    };

    return await httpClient.sendRequest(request);
  },
};
