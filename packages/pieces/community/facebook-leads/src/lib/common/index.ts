import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const facebookLeadsCommon = {
  baseUrl: 'https://graph.facebook.com',
  page: Property.Dropdown({
    displayName: 'Page',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account',
        };
      }

      try {
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const pages: any[] = (
          await facebookLeadsCommon.getPages(authProp.access_token)
        ).map((page: FacebookPage) => {
          return {
            label: page.name,
            value: {
              id: page.id,
              accessToken: page.access_token,
            },
          };
        });

        return {
          options: pages,
          placeholder: 'Choose a page',
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your account',
        };
      }
    },
  }),

  form: Property.Dropdown({
    displayName: 'Form',
    required: false,
    refreshers: ['page'],
    options: async ({ page }) => {
      if (!page) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Choose a page',
        };
      }

      try {
        const modifiedPage = page as FacebookPageDropdown;
        const forms: any[] = (
          await facebookLeadsCommon.getPageForms(
            modifiedPage.id,
            modifiedPage.accessToken
          )
        ).map((form: FacebookForm) => {
          return {
            label: form.name,
            value: form.id,
          };
        });

        forms.unshift({
          label: 'All Forms (Default)',
          value: undefined,
        });

        return {
          options: forms,
          placeholder: 'Choose a form',
        };
      } catch (e) {
        console.debug(e);
        return {
          disabled: true,
          options: [],
          placeholder: 'Choose a page',
        };
      }
    },
  }),

  subscribePageToApp: async (pageId: any, accessToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${facebookLeadsCommon.baseUrl}/${pageId}/subscribed_apps`,
      body: {
        access_token: accessToken,
        subscribed_fields: ['leadgen'],
      },
    };

    await httpClient.sendRequest(request);
  },

  getPages: async (accessToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${facebookLeadsCommon.baseUrl}/me/accounts`,
      queryParams: {
        access_token: accessToken,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body.data;
  },

  getPageForms: async (pageId: string, accessToken: string) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${facebookLeadsCommon.baseUrl}/${pageId}/leadgen_forms`,
      queryParams: {
        access_token: accessToken,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body.data;
  },

  getLeadDetails: async (leadId: string, accessToken: string) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${facebookLeadsCommon.baseUrl}/${leadId}`,
      queryParams: {
        access_token: accessToken,
      },
    });

    return response.body;
  },

  loadSampleData: async (formId: string, accessToken: string) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${facebookLeadsCommon.baseUrl}/${formId}/leads`,
      queryParams: {
        access_token: accessToken,
      },
    });

    return response.body;
  },
};

export interface FacebookOAuth2 {
  access_token: string;
  expires_in: number;
  claimed_at: number;
  scope: string;
  client_id: string;
  token_type: string;
  data: object;
  authorization_method: string;
  code: string;
  type: string;
  redirect_url: string;
  token_url: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  category_list: string[];
  access_token: string;
  tasks: string[];
}

export interface FacebookPageDropdown {
  id: string;
  accessToken: string;
}

export interface FacebookForm {
  id: string;
  locale: string;
  name: string;
  status: string;
}
