import { Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const jotformCommon = {
  baseUrl: (region: string) => {
    if (region === 'eu') {
      return 'https://eu-api.jotform.com';
    }
    return 'https://api.jotform.com';
  },
  form: Property.Dropdown({
    displayName: 'Form',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Enter API Key',
        };
      }
      const authProp = auth as { apiKey: string; region: string };
      const options: any[] = await jotformCommon.getUserForms(
        authProp.apiKey,
        authProp.region
      );
      return {
        options: options,
        placeholder: 'Choose form to connect',
      };
    },
  }),
  getUserForms: async (apiKey: string, region: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${jotformCommon.baseUrl(region)}/user/forms`,
      headers: {
        APIKEY: apiKey,
      },
    };
    const response = await httpClient.sendRequest(request);
    const newValues = response.body.content.map((form: JotformForm) => {
      return {
        label: form.title,
        value: form.id,
      };
    });

    return newValues;
  },

  subscribeWebhook: async (
    formId: any,
    webhookUrl: string,
    authentication: { apiKey: string; region: string }
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${jotformCommon.baseUrl(
        authentication.region
      )}/form/${formId}/webhooks`,
      headers: {
        APIKEY: authentication.apiKey,
        'Content-Type': 'multipart/form-data',
      },
      body: {
        webhookURL: webhookUrl,
      },
    };

    await httpClient.sendRequest(request);
  },

  unsubscribeWebhook: async (
    formId: any,
    webhookUrl: string,
    authentication: { apiKey: string; region: string }
  ) => {
    const getWebhooksRequest: HttpRequest = {
      method: HttpMethod.GET,
      url: `${jotformCommon.baseUrl(
        authentication.region
      )}/form/${formId}/webhooks`,
      headers: {
        APIKEY: authentication.apiKey,
      },
    };

    const response = await httpClient.sendRequest(getWebhooksRequest);
    let webhookId;

    Object.entries(response.body.content).forEach(([key, value]) => {
      if (value == webhookUrl) {
        webhookId = key;
      }
    });

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${jotformCommon.baseUrl(
        authentication.region
      )}/form/${formId}/webhooks/${webhookId}`,
      headers: {
        APIKEY: authentication.apiKey,
      },
    };

    const deleteResponse = await httpClient.sendRequest(request);
    return deleteResponse;
  },
};

export interface JotformForm {
  id: string;
  username: string;
  title: string;
  height: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_submission: string;
  new: string;
  count: string;
  type: string;
  favorite: string;
  archived: string;
  url: string;
}

export interface WebhookInformation {
  jotformWebhook: string;
}
