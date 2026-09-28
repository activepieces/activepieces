import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { jotformAuth } from '../auth';

export const jotformCommon = {
  baseUrl: (region: string) => {
    if (region === 'eu') {
      return 'https://eu-api.jotform.com';
    }
    if (region === 'hipaa') {
      return 'https://hipaa-api.jotform.com';
    }
    return 'https://api.jotform.com';
  },
  form: Property.Dropdown({
    auth: jotformAuth,
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
      const authProp = auth.props;
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
  request: async <T>({
    method,
    path,
    apiKey,
    region,
    queryParams,
    body,
    form,
  }: {
    method: HttpMethod;
    path: string;
    apiKey: string;
    region: string;
    queryParams?: Record<string, string>;
    body?: Record<string, unknown> | unknown[];
    form?: boolean;
  }): Promise<T> => {
    const response = await httpClient.sendRequest<{
      responseCode: number;
      message: string;
      content: T;
    }>({
      method,
      url: `${jotformCommon.baseUrl(region)}${path}`,
      headers: {
        APIKEY: apiKey,
        ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      queryParams,
      body,
    });
    if (response.body.responseCode >= 300) {
      throw new Error(
        `Jotform API error (${response.body.responseCode}): ${response.body.message}`
      );
    }
    return response.body.content;
  },

  flattenForForm: (
    prefix: string,
    value: unknown,
    out: Record<string, unknown>
  ): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        jotformCommon.flattenForForm(`${prefix}[${index}]`, item, out)
      );
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value as Record<string, unknown>).forEach(([key, nested]) =>
        jotformCommon.flattenForForm(`${prefix}[${key}]`, nested, out)
      );
    } else {
      out[prefix] = value;
    }
  },

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
    authentication: AppConnectionValueForAuthProperty<typeof jotformAuth>
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${jotformCommon.baseUrl(
        authentication.props.region
      )}/form/${formId}/webhooks`,
      headers: {
        APIKEY: authentication.props.apiKey,
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
    authentication: AppConnectionValueForAuthProperty<typeof jotformAuth>
  ) => {
    const getWebhooksRequest: HttpRequest = {
      method: HttpMethod.GET,
      url: `${jotformCommon.baseUrl(
        authentication.props.region
      )}/form/${formId}/webhooks`,
      headers: {
        APIKEY: authentication.props.apiKey,
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
        authentication.props.region
      )}/form/${formId}/webhooks/${webhookId}`,
      headers: {
        APIKEY: authentication.props. apiKey,
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
