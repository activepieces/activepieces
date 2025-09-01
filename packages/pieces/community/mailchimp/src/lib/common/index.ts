import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { AuthenticationType } from '@activepieces/pieces-common';
import crypto from 'crypto';

export const mailchimpCommon = {
  mailChimpListIdDropdown: Property.Dropdown<string>({
    displayName: 'Audience',
    refreshers: [],
    description: 'Audience you want to add the contact to',
    required: true,
    options: async ({ auth }) => {
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
    const mailChimpServerPrefix =
      await mailchimpCommon.getMailChimpServerPrefix(access_token!);
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

  mailChimpCampaignIdDropdown: Property.Dropdown<string>({
    displayName: 'Campaign',
    refreshers: [],
    description: 'Select the campaign to get information for',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a connection',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      const campaignResponse = (await mailchimpCommon.getUserCampaigns(
        authProp
      )) as any;

      const options = campaignResponse.campaigns.map((campaign: any) => ({
        label: `${campaign.settings?.title || campaign.id} (${campaign.status})`,
        value: campaign.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),

  getUserCampaigns: async (authProp: OAuth2PropertyValue) => {
    const access_token = authProp.access_token;
    const mailChimpServerPrefix =
      await mailchimpCommon.getMailChimpServerPrefix(access_token!);
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    // Get campaigns with essential fields for dropdown
    return await (mailchimp as any).campaigns.list({
      fields: ['campaigns.id', 'campaigns.settings.title', 'campaigns.status', 'total_items'],
      count: 1000,
    });
  },

  mailChimpStoreIdDropdown: Property.Dropdown<string>({
    displayName: 'Store',
    refreshers: [],
    description: 'Select the e-commerce store',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a connection',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      const storeResponse = (await mailchimpCommon.getUserStores(
        authProp
      )) as any;

      const options = storeResponse.stores.map((store: any) => ({
        label: `${store.name} (${store.id})`,
        value: store.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),

  getUserStores: async (authProp: OAuth2PropertyValue) => {
    const access_token = authProp.access_token;
    const mailChimpServerPrefix =
      await mailchimpCommon.getMailChimpServerPrefix(access_token!);
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    // Get stores with essential fields for dropdown
    return await (mailchimp as any).ecommerce.stores({
      fields: ['stores.id', 'stores.name', 'total_items'],
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