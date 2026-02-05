import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { formitableAuth } from '../..';

export const formitableCommon = {
  baseUrl: 'https://api.formitable.com/api/v1.2',

  restaurant: Property.Dropdown({
    displayName: 'Restaurant',
    description: 'Select the restaurant to monitor',
    required: true,
    auth: formitableAuth,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }
      const apiKey = (auth as { secret_text: string }).secret_text;
      const restaurants = await formitableApiCall<Restaurant[]>({
        apiKey,
        method: HttpMethod.GET,
        endpoint: '/restaurants',
      });
      return {
        disabled: false,
        options: restaurants.map((restaurant) => ({
          label: restaurant.name,
          value: restaurant.uid,
        })),
      };
    },
  }),
};

export interface Restaurant {
  uid: string;
  name: string;
}

export interface WebhookResponse {
  uid: string;
  events: string[];
  url: string;
  secretKey: string;
}

export async function formitableApiCall<T>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${formitableCommon.baseUrl}${endpoint}`,
    headers: {
      ApiKey: apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });
  return response.body;
}

export async function createWebhook({
  apiKey,
  restaurantUid,
  webhookUrl,
  events,
  secretKey,
}: {
  apiKey: string;
  restaurantUid: string;
  webhookUrl: string;
  events: string[];
  secretKey: string;
}): Promise<WebhookResponse> {
  return formitableApiCall<WebhookResponse>({
    apiKey,
    method: HttpMethod.POST,
    endpoint: `/${restaurantUid}/webhook`,
    body: {
      events,
      url: webhookUrl,
      secretKey,
    },
  });
}

export async function deleteWebhook({
  apiKey,
  restaurantUid,
  webhookUid,
}: {
  apiKey: string;
  restaurantUid: string;
  webhookUid: string;
}): Promise<void> {
  await formitableApiCall<void>({
    apiKey,
    method: HttpMethod.DELETE,
    endpoint: `/${restaurantUid}/webhook/${webhookUid}`,
  });
}
