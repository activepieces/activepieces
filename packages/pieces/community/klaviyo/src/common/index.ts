import {
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '..';

const API_BASE = 'https://a.klaviyo.com/api';
const API_REVISION = '2024-10-15';

export async function klaviyoApiCall<T extends HttpMessageBody>(
  method: HttpMethod,
  endpoint: string,
  apiKey: string,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<HttpResponse<T>> {
  const url = new URL(`${API_BASE}/${endpoint}`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      url.searchParams.set(key, value);
    }
  }
  return await httpClient.sendRequest<T>({
    method,
    url: url.toString(),
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: API_REVISION,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: body as any,
  });
}

export async function klaviyoPaginatedCall<T>(
  endpoint: string,
  apiKey: string,
  queryParams?: Record<string, string>,
  maxPages = 10
): Promise<T[]> {
  const items: T[] = [];
  let url: string | null = `${API_BASE}/${endpoint}`;
  if (queryParams) {
    const u = new URL(url);
    for (const [key, value] of Object.entries(queryParams)) {
      u.searchParams.set(key, value);
    }
    url = u.toString();
  }
  let page = 0;
  while (url && page < maxPages) {
    const response = await httpClient.sendRequest<{
      data: T[];
      links?: { next?: string };
    }>({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: API_REVISION,
        Accept: 'application/vnd.api+json',
      },
    });
    items.push(...response.body.data);
    url = response.body.links?.next ?? null;
    page++;
  }
  return items;
}

export const klaviyoCommon = {
  lists: Property.Dropdown({
    displayName: 'List',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      const apiKey = (auth as { secret_text: string }).secret_text;
      const lists = await klaviyoPaginatedCall<{
        id: string;
        attributes: { name: string };
      }>('lists', apiKey);
      return {
        disabled: false,
        options: lists.map((l) => ({
          label: l.attributes.name,
          value: l.id,
        })),
      };
    },
  }),
  optionalList: Property.Dropdown({
    displayName: 'List',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      const apiKey = (auth as { secret_text: string }).secret_text;
      const lists = await klaviyoPaginatedCall<{
        id: string;
        attributes: { name: string };
      }>('lists', apiKey);
      return {
        disabled: false,
        options: lists.map((l) => ({
          label: l.attributes.name,
          value: l.id,
        })),
      };
    },
  }),
};
