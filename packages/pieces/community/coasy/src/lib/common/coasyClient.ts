import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export class CoasyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }


  async action(actionName: string, request: any) {
    return this.request(`/apps/actions/${actionName}`, request);
  }

  async createTrigger(trigger: string, hookUrl: string, filter: any) {
    return this.request(`/apps/triggers/create`, {
      hookUrl,
      trigger,
      filter
    });
  }

  async destroyTrigger(webhookId: string) {
    return this.request(`/apps/triggers/destroy`, { webhookId})
  }

  async listTriggerEvents(trigger: string) {
    return this.request(`/apps/list`, {
      trigger
    })
  }


  async request(path: string, requestBody: any) {
    const request: HttpRequest<string> = {
      method: HttpMethod.POST,
      url: `${this.baseUrl}${path}`,
      body: JSON.stringify(requestBody),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey
      },
    };

    const response = await httpClient.sendRequest(request);

    if (response.status !== 200) {
      throw new Error(`Failed to communicate with Mailjet`);
    } else {
      return response.body;
    }
  }

}
