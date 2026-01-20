import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.digitalpilot.app/v1';

export interface DigitalPilotClient {
  addTargetAccount(tagId: string, listId: string, domain: string): Promise<void>;
  removeTargetAccount(tagId: string, listId: string, domain: string): Promise<void>;
  createWebhook(tagId: string, webhookURL: string, subscriptions: 'target_accounts' | 'high_intent'): Promise<WebhookResponse>;
  deleteWebhook(tagId: string, webhookURL?: string, webhookID?: string): Promise<void>;
}

export interface WebhookResponse {
  id: string;
  url: string;
  subscriptions: string;
}

class DigitalPilotClientImpl implements DigitalPilotClient {
  constructor(private readonly apiKey: string) {}

  async addTargetAccount(
    tagId: string,
    listId: string,
    domain: string
  ): Promise<void> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${BASE_URL}/tags/${tagId}/target-accounts/${listId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        domain,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (response.status === 200) {
      return;
    }

    let errorMessage = 'Unknown error occurred';
    switch (response.status) {
      case 400:
        errorMessage = 'Invalid input. Please check your parameters.';
        break;
      case 401:
        errorMessage = 'Authentication failed. Please check your API key.';
        break;
      case 404:
        errorMessage = 'Tag or list not found. Please verify your selection.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded. Please try again later.';
        break;
      case 500:
        errorMessage = 'DigitalPilot server error. Please try again later.';
        break;
    }

    throw new Error(errorMessage);
  }

  async removeTargetAccount(
    tagId: string,
    listId: string,
    domain: string
  ): Promise<void> {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${BASE_URL}/tags/${tagId}/target-accounts/${listId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        domain,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (response.status === 200) {
      return;
    }

    let errorMessage = 'Unknown error occurred';
    switch (response.status) {
      case 400:
        errorMessage = 'Invalid input. Please check your parameters.';
        break;
      case 401:
        errorMessage = 'Authentication failed. Please check your API key.';
        break;
      case 404:
        errorMessage = 'Tag or list not found. Please verify your selection.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded. Please try again later.';
        break;
      case 500:
        errorMessage = 'DigitalPilot server error. Please try again later.';
        break;
    }

    throw new Error(errorMessage);
  }

  async createWebhook(
    tagId: string,
    webhookURL: string,
    subscriptions: 'target_accounts' | 'high_intent'
  ): Promise<WebhookResponse> {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${BASE_URL}/tags/${tagId}/webhooks`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        webhookURL,
        subscriptions,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
    };

    const response = await httpClient.sendRequest<WebhookResponse>(request);

    if (response.status === 200) {
      return response.body;
    }

    let errorMessage = 'Failed to register webhook';
    switch (response.status) {
      case 400:
        errorMessage = 'Invalid webhook parameters. Please check your inputs.';
        break;
      case 401:
        errorMessage = 'Authentication failed. Please check your API key.';
        break;
      case 404:
        errorMessage = 'Tag not found. Please verify your selection.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded. Please try again later.';
        break;
      case 500:
        errorMessage = 'DigitalPilot server error. Please try again later.';
        break;
    }

    throw new Error(errorMessage);
  }

  async deleteWebhook(
    tagId: string,
    webhookURL?: string,
    webhookID?: string
  ): Promise<void> {
    const body: { webhookURL?: string; webhookID?: string } = {};
    if (webhookURL) {
      body.webhookURL = webhookURL;
    }
    if (webhookID) {
      body.webhookID = webhookID;
    }

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${BASE_URL}/tags/${tagId}/webhooks`,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: this.apiKey,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (response.status === 200) {
      return;
    }

    let errorMessage = 'Failed to delete webhook';
    switch (response.status) {
      case 400:
        errorMessage = 'Invalid webhook parameters.';
        break;
      case 401:
        errorMessage = 'Authentication failed. Please check your API key.';
        break;
      case 404:
        errorMessage = 'Webhook not found.';
        break;
      case 429:
        errorMessage = 'Rate limit exceeded.';
        break;
      case 500:
        errorMessage = 'DigitalPilot server error.';
        break;
    }

    console.warn(`Webhook deletion warning: ${errorMessage}`);
  }
}

export function makeClient(auth: string): DigitalPilotClient {
  return new DigitalPilotClientImpl(auth);
}
