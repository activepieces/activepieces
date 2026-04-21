import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from './auth';
import { LEMON_SQUEEZY_API_BASE } from './api';

export const subscribeWebhook = async (auth: string, storeId: string, events: string[], targetUrl: string, secret: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${LEMON_SQUEEZY_API_BASE}/webhooks`,
    headers: {
      'Authorization': `Bearer ${auth}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    },
    body: {
      data: {
        type: 'webhooks',
        attributes: {
          url: targetUrl,
          events: events,
          secret: secret,
          test_mode: false
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId
            }
          }
        }
      }
    }
  });
  return response.body;
};

export const unsubscribeWebhook = async (auth: string, webhookId: string) => {
  await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `${LEMON_SQUEEZY_API_BASE}/webhooks/${webhookId}`,
    headers: {
      'Authorization': `Bearer ${auth}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    }
  });
};

export const getStores = async (auth: string) => {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${LEMON_SQUEEZY_API_BASE}/stores`,
    headers: {
      'Authorization': `Bearer ${auth}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    }
  });
  return response.body.data;
};

export const createStoreDropdownProperty = () => {
  return Property.Dropdown({
    displayName: 'Store',
    required: true,
    refreshers: ['auth'],
    auth: lemonSqueezyAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first'
        };
      }

      try {
        const stores = await getStores(auth.secret_text);
        return {
          options: stores.map((store: any) => ({
            label: store.attributes.name,
            value: store.id
          }))
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load stores'
        };
      }
    }
  });
};

export const generateWebhookSecret = () => {
  return `lemonsqueezy_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

export const createWebhookTriggerKey = (eventName: string) => {
  return `_${eventName}_trigger`;
};
