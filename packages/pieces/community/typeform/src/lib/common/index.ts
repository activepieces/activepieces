import {
  Property,
  OAuth2PropertyValue,
  DropdownOption,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

type FormListResponse = {
  page_count: number;
  total_items: number;
  items: {
    id: string;
    title: string;
  }[];
};

export const formsDropdown = Property.Dropdown<string>({
  displayName: 'Form',
  description: 'Form Name',
  required: true,
  refreshers: [],
  async options({ auth: authentication }) {
    const auth = authentication as OAuth2PropertyValue;

    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect typeform account',
        options: [],
      };
    }

    const accessToken = auth.access_token;

    const options: DropdownOption<string>[] = [];
    let hasMore = true;
    let page = 1;

    do {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.typeform.com/forms',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        queryParams: {
          page: page.toString(),
          page_size: '200',
        },
      };

      const response = await httpClient.sendRequest<FormListResponse>(request);

      for (const form of response.body.items) {
        options.push({ label: form.title, value: form.id });
      }

      hasMore =
        response.body.page_count != undefined &&
        page < response.body.page_count;

      page++;
    } while (hasMore);

    return {
      disabled: false,
      placeholder: 'Select form',
      options,
    };
  },
});

export const typeformCommon = {
  baseUrl: 'https://api.typeform.com',
  subscribeWebhook: async (
    formId: string,
    tag: string,
    webhookUrl: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${typeformCommon.baseUrl}/forms/${formId}/webhooks/${tag}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        enabled: true,
        url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      queryParams: {},
    };

    await httpClient.sendRequest(request);
  },
  unsubscribeWebhook: async (
    formId: string,
    tag: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${typeformCommon.baseUrl}/forms/${formId}/webhooks/${tag}`,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  },
};
