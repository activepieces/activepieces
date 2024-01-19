import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const smCommon = {
  baseUrl: 'https://api.surveymonkey.com/v3',
  survey: Property.Dropdown({
    displayName: 'Survey',
    required: true,
    refreshers: [],
    options: async (context) => {
      if (!context['auth']) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account',
        };
      }

      const authProp: any = context['auth'];
      const options: any[] = await smCommon.getSurveys(authProp.access_token);
      return {
        options: options,
        placeholder: 'Choose survey to connect',
      };
    },
  }),
  getSurveys: async (accessToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${smCommon.baseUrl}/surveys`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    const response = await httpClient.sendRequest(request);
    const newValues = response.body['data'].map((survey: any) => {
      return {
        label: survey.title,
        value: survey.id,
      };
    });

    return newValues;
  },

  subscribeWebhook: async (
    surveyId: string | number,
    webhookUrl: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${smCommon.baseUrl}/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      body: {
        name: 'New Response Webhook',
        event_type: 'response_created',
        object_type: 'survey',
        object_ids: [surveyId],
        subscription_url: webhookUrl,
      },
    };

    const webhookData = await httpClient.sendRequest(request);
    return webhookData.body['id'];
  },

  unsubscribeWebhook: async (
    webhookId: string | number,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${smCommon.baseUrl}/webhooks/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const deleteResponse = await httpClient.sendRequest(request);
    return deleteResponse;
  },

  async getResponseDetails(
    accessToken: string,
    surveyId: string | number,
    responseId: string | number
  ) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${smCommon.baseUrl}/surveys/${surveyId}/responses/${responseId}/details`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
};
