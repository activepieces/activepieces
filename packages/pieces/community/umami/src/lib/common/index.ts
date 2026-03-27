import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { umamiAuth } from '../..';

export async function umamiApiCall<T extends HttpMessageBody>({
  serverUrl,
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  serverUrl: string;
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const baseUrl = serverUrl.replace(/\/+$/, '');
  return await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}/api${path}`,
    headers: {
      'x-umami-api-key': apiKey,
    },
    queryParams,
    body,
  });
}

export const umamiCommon = {
  websiteDropdown: Property.Dropdown({
    displayName: 'Website',
    description: 'Select the website to use.',
    auth: umamiAuth,
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
      const { base_url, api_key } = (auth as unknown as { props: { base_url: string; api_key: string } }).props;
      try {
        const response = await umamiApiCall<{ data: { id: string; name: string; domain: string }[] }>({
          serverUrl: base_url,
          apiKey: api_key,
          method: HttpMethod.GET,
          path: '/websites',
          queryParams: { pageSize: '100' },
        });
        return {
          disabled: false,
          options: response.body.data.map((w) => ({
            label: `${w.name} (${w.domain})`,
            value: w.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load websites. Check your connection.',
        };
      }
    },
  }),

  dateRange: {
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Beginning of the date range.',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End of the date range.',
      required: true,
    }),
  },
};
