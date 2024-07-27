import {
    HttpRequest,
    HttpMethod,
    AuthenticationType,
    httpClient,
  } from '@activepieces/pieces-common';
  // baseUrl: 'https://syncedtestingapi.azurewebsites.net/api',
  export const syncedCommon = {
    baseUrl: 'https://syncedtestingapi.azurewebsites.net/api',
    subscribeWebhook: async (
      webhookUrl: string,
      apiKey: string,
      eventType:string
    ) => {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${syncedCommon.baseUrl}/WebhookApi/subscribeWebhook`,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `${apiKey}`,
        },
        body: {
          webhookUrl: webhookUrl,
          Id:0,
          eventType:eventType
        },

        queryParams: {},
      };
      const { body: webhook } = await httpClient.sendRequest<{message:any}>(

        request
      );
      return webhook;
    },
    unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${syncedCommon.baseUrl}/WebhookApi/unsubscribeWebhook`,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `${apiKey}`,
        },
        body: {
          Id:webhookId
        }
      };
      return await httpClient.sendRequest(request);
    },
  };
