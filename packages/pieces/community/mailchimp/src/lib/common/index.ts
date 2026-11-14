import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { AuthenticationType } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { mailchimpAuth } from '../..';

export const mailchimpCommon = {
  mailChimpListIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth>({
    auth: mailchimpAuth,
    displayName: 'Audience',
    refreshers: [],
    description: 'Your Mailchimp audience, also called a list.',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      try {
        const listResponse = (await mailchimpCommon.getUserLists(
          authProp
        )) as any;

        const options = listResponse.lists.map((list: any) => ({
          label: list.name,
          value: list.id,
        }));

        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No audiences found.',
          };
        }

        return {
          disabled: false,
          options,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load audiences. Check your connection.',
        };
      }
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

  mailChimpCampaignIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth >({
    auth: mailchimpAuth,
    displayName: 'Campaign',
    refreshers: [],
    description: 'Only sent campaigns have a report.',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      try {
        const campaignResponse = (await mailchimpCommon.getUserCampaigns(
          authProp
        )) as any;

        const options = campaignResponse.campaigns.map((campaign: any) => ({
          label: `${campaign.settings?.title || campaign.id} (${readableCampaignStatus(campaign.status)})`,
          value: campaign.id,
        }));

        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No campaigns found.',
          };
        }

        return {
          disabled: false,
          options,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load campaigns. Check your connection.',
        };
      }
    },
  }),

  getUserCampaigns: async (authProp: OAuth2PropertyValue, options?: { status?: string }) => {
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
      ...(options?.status ? { status: options.status } : {}),
    });
  },

  mailChimpDraftCampaignIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth >({
    auth: mailchimpAuth,
    displayName: 'Campaign',
    refreshers: [],
    description: 'Only draft campaigns are listed.',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      try {
        // Mailchimp only accepts the send action on campaigns in "save" (draft) status.
        const campaignResponse = (await mailchimpCommon.getUserCampaigns(
          authProp,
          { status: 'save' }
        )) as any;

        const options = campaignResponse.campaigns.map((campaign: any) => ({
          label: `${campaign.settings?.title || campaign.id}`,
          value: campaign.id,
        }));

        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No draft campaigns found.',
          };
        }

        return {
          disabled: false,
          options,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load draft campaigns. Check your connection.',
        };
      }
    },
  }),

  mailChimpStoreIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth >({
    auth: mailchimpAuth,
    displayName: 'Store',
    refreshers: [],
    description: 'An e-commerce store connected to Mailchimp.',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      const authProp = auth as OAuth2PropertyValue;
      try {
        const storeResponse = (await mailchimpCommon.getUserStores(
          authProp
        )) as any;

        const options = storeResponse.stores.map((store: any) => ({
          label: `${store.name} (${store.id})`,
          value: store.id,
        }));

        if (options.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No stores found.',
          };
        }

        return {
          disabled: false,
          options,
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load stores. Check your connection.',
        };
      }
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

function readableCampaignStatus(status: string): string {
  switch (status) {
    case 'save':
      return 'Draft';
    case 'paused':
      return 'Paused';
    case 'schedule':
      return 'Scheduled';
    case 'sending':
      return 'Sending';
    case 'sent':
      return 'Sent';
    case 'canceled':
      return 'Canceled';
    case 'canceling':
      return 'Canceling';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

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