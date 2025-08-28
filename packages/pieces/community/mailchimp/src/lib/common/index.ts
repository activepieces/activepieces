import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { AuthenticationType } from '@activepieces/pieces-common';
import crypto from 'crypto';

interface MailchimpCommon {
  mailChimpListIdDropdown: any; // Replace 'any' with the proper type from @activepieces/pieces-framework
  getUserLists(authProp: OAuth2PropertyValue): Promise<unknown>;
  getMailChimpServerPrefix(access_token: string): Promise<string>;
  enableWebhookRequest(params: EnableTriggerRequestParams): Promise<string>;
  disableWebhookRequest(params: DisableTriggerRequestParams): Promise<void>;
  getMD5EmailHash(email: string): string;
  mailChimpCampaignIdDropdown: any; // Replace 'any' with the proper type
  mailChimpStoreIdDropdown: any; // Replace 'any' with the proper type
  makeApiRequest<T = any>(
    authProp: OAuth2PropertyValue,
    endpoint: string,
    method?: HttpMethod,
    body?: any
  ): Promise<T>;
}

export const mailchimpCommon: MailchimpCommon = {
  mailChimpListIdDropdown: Property.Dropdown<string>({
    displayName: 'Audience',
    refreshers: [],
    description: 'Audience you want to add the contact to',
    required: true,
    options: async ({ auth }): Promise<{ disabled: boolean; options: Array<{ label: string; value: string }>; placeholder?: string }> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a connection',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      const listResponse = (await mailchimpCommon.getUserLists(
        authProp
      )) as any;

      const options = listResponse.lists.map((list: any) => ({
        label: list.name,
        value: list.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),
  getUserLists: async (authProp: OAuth2PropertyValue) => {
    const access_token = authProp.access_token;
    const mailChimpServerPrefix: string = await mailchimpCommon.getMailChimpServerPrefix(
      authProp.access_token
    );
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    // mailchimp types are not complete this is from the docs.
    return await (mailchimp as any).lists.getAllLists({
      fields: ['lists.id', 'lists.name', 'total_items'],
      count: 1000,
    });
  },
  getMailChimpServerPrefix: async (access_token: string) => {
    const mailChimpMetaDataRequest: HttpRequest<{ dc: string }> = {
      method: HttpMethod.GET,
      url: 'https://login.mailchimp.com/oauth2/metadata',
      headers: {
        Authorization: `OAuth ${access_token}`,
      },
    };
    return (await httpClient.sendRequest(mailChimpMetaDataRequest)).body['dc'];
  },
  enableWebhookRequest: async ({
    server,
    token,
    listId,
    webhookUrl,
    events,
  }: EnableTriggerRequestParams): Promise<string> => {
    const response = await httpClient.sendRequest<EnableTriggerResponse>({
      method: HttpMethod.POST,
      url: `https://${server}.api.mailchimp.com/3.0/lists/${listId}/webhooks`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: {
        url: webhookUrl,
        events,
        sources: {
          user: true,
          admin: true,
          api: true,
        },
      },
    });

    const { id: webhookId } = response.body;
    return webhookId;
  },
  disableWebhookRequest: async ({
    server,
    token,
    listId,
    webhookId,
  }: DisableTriggerRequestParams): Promise<void> => {
    await httpClient.sendRequest<EnableTriggerResponse>({
      method: HttpMethod.DELETE,
      url: `https://${server}.api.mailchimp.com/3.0/lists/${listId}/webhooks/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    });
  },
  getMD5EmailHash: (email: string) => {
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  },
  mailChimpCampaignIdDropdown: Property.Dropdown<string>({
    displayName: 'Campaign',
    refreshers: [],
    description: 'Campaign to use',
    required: true,
    options: async ({ auth }): Promise<{ disabled: boolean; options: Array<{ label: string; value: string }>; placeholder?: string }> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a connection',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      const access_token = authProp.access_token;
      const mailChimpServerPrefix: string = await mailchimpCommon.getMailChimpServerPrefix(
        authProp.access_token
      );
      
      const campaignResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${mailChimpServerPrefix}.api.mailchimp.com/3.0/campaigns`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: access_token!,
        },
      });

      const options = campaignResponse.body.campaigns.map((campaign: any) => ({
        label: campaign.settings.subject_line || campaign.id,
        value: campaign.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),
  mailChimpStoreIdDropdown: Property.Dropdown<string>({
    displayName: 'Store',
    refreshers: [],
    description: 'E-commerce store to use',
    required: true,
    options: async ({ auth }): Promise<{ disabled: boolean; options: Array<{ label: string; value: string }>; placeholder?: string }> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a connection',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      const access_token = authProp.access_token;
      const mailChimpServerPrefix: string = await mailchimpCommon.getMailChimpServerPrefix(
        authProp.access_token
      );
      
      const storeResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${mailChimpServerPrefix}.api.mailchimp.com/3.0/ecommerce/stores`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: access_token!,
        },
      });

      const options = storeResponse.body.stores.map((store: any) => ({
        label: store.name,
        value: store.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),
  makeApiRequest: async function <T = any>(
    authProp: OAuth2PropertyValue,
    endpoint: string,
    method: HttpMethod = HttpMethod.GET,
    body?: any
  ): Promise<T> {
    const access_token = authProp.access_token;
    const mailChimpServerPrefix: string = await mailchimpCommon.getMailChimpServerPrefix(
      authProp.access_token
    );
    
    const response = await httpClient.sendRequest<T>({
      method,
      url: `https://${mailChimpServerPrefix}.api.mailchimp.com/3.0${endpoint}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token!,
      },
      body,
    });

    return response.body;
  },
};

type TriggerRequestParams = {
  server: string;
  token: string;
  listId: string;
};

type EnableTriggerRequestParams = TriggerRequestParams & {
  webhookUrl: string;
  events: object;
};

type DisableTriggerRequestParams = TriggerRequestParams & {
  webhookId: string;
};

type EnableTriggerResponse = {
  id: string;
  url: string;
  list_id: string;
};
