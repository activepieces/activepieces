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
      organization_id:string,
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
          OrganizationID: organization_id,
          eventType:eventType
        },
        
        queryParams: {},
      }; 
      const { body: webhook } = await httpClient.sendRequest<{message:any}>(
       
        request
      );
      return webhook;
    },
    unsubscribeWebhook: async (organization_id:string,webhookId: string, apiKey: string) => {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${syncedCommon.baseUrl}/WebhookApi/unsubscribeWebhook`,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `${apiKey}`,
        },
        body: {
          Id:34,
          OrganizationID: organization_id
        }
      };
      return await httpClient.sendRequest(request);
    },
  };
  