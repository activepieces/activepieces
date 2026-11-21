import { Property, OAuth2PropertyValue, WebhookHandshakeStrategy } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { AuthenticationType } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { mailchimpAuth } from '../..';
import { mailchimpApi } from './client';

const HANDSHAKE_PARAM = 'mc_handshake';

export const mailchimpCommon = {
  mailChimpListIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth>({
    auth: mailchimpAuth,
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

  mailChimpCampaignIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth >({
    auth: mailchimpAuth,
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
    description: 'Select the draft campaign to send',
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
      // Mailchimp only accepts the send action on campaigns in "save" (draft) status.
      const campaignResponse = (await mailchimpCommon.getUserCampaigns(
        authProp,
        { status: 'save' }
      )) as any;

      const options = campaignResponse.campaigns.map((campaign: any) => ({
        label: `${campaign.settings?.title || campaign.id}`,
        value: campaign.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  }),

  mailChimpStoreIdDropdown: Property.Dropdown<string,true,typeof mailchimpAuth >({
    auth: mailchimpAuth,
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
      timeout: 15000,
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
  mailChimpOptionalListIdDropdown: Property.Dropdown<string, false, typeof mailchimpAuth>({
    auth: mailchimpAuth,
    displayName: 'Audience',
    refreshers: [],
    description: 'Optional audience (list) to limit the search to. Leave empty to search every audience.',
    required: false,
    options: async ({ auth }) => listDropdownOptions(auth),
  }),
  mailChimpSegmentIdDropdown: Property.Dropdown<string, true, typeof mailchimpAuth>({
    auth: mailchimpAuth,
    displayName: 'Segment or Tag',
    refreshers: ['list_id'],
    description: 'Segment or tag in the selected audience. Agents can pass the numeric segment ID from List Segments.',
    required: true,
    options: async ({ auth, list_id }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please select a connection' };
      }
      if (typeof list_id !== 'string' || list_id.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select an audience first' };
      }
      try {
        const client = createMailchimpClient({ accessToken: auth.access_token });
        const segments = await client.listAll<{ id: number; name: string; type: string }>({
          path: `/lists/${encodeURIComponent(list_id)}/segments`,
          itemsKey: 'segments',
          queryParams: { fields: 'segments.id,segments.name,segments.type,total_items' },
          operation: 'list segments',
        });
        return {
          disabled: false,
          options: segments.map((segment) => ({
            label: `${segment.name} (${segment.type})`,
            value: String(segment.id),
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: error instanceof Error ? error.message : 'Could not load segments',
        };
      }
    },
  }),
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: HANDSHAKE_PARAM,
  },
  withHandshakeMarker: (webhookUrl: string): string => {
    const url = new URL(webhookUrl);
    url.searchParams.set(HANDSHAKE_PARAM, '1');
    return url.toString();
  },
  respondToHandshake: async ({ payload }: { payload: HandshakePayload }) => {
    const method = payload.method?.toUpperCase();
    const hasEvent =
      typeof payload.body === 'object' && payload.body !== null && 'type' in payload.body;
    if (method === 'POST' || hasEvent) {
      throw new Error('Mailchimp event delivery, not a URL check; handled by the trigger run.');
    }
    return { status: 200, body: {} };
  },
  getMD5EmailHash: (email: string) => {
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  },
};

async function listDropdownOptions(auth: OAuth2PropertyValue | undefined) {
  if (!auth) {
    return { disabled: true, options: [], placeholder: 'Please select a connection' };
  }
  try {
    const client = createMailchimpClient({ accessToken: auth.access_token });
    const lists = await client.listAll<{ id: string; name: string }>({
      path: '/lists',
      itemsKey: 'lists',
      queryParams: { fields: 'lists.id,lists.name,total_items' },
      operation: 'list audiences',
    });
    return {
      disabled: false,
      options: lists.map((list) => ({ label: list.name, value: list.id })),
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: error instanceof Error ? error.message : 'Could not load audiences',
    };
  }
}

function createMailchimpClient({ accessToken }: { accessToken: string }) {
  return mailchimpApi.createClient({ accessToken });
}

type HandshakePayload = { method?: string; body: unknown };

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