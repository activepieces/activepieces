import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import {
  umamiAuth,
  getAuthHeaders,
  getBaseUrl,
  UmamiAuthValue,
} from '../auth';

export async function umamiApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: UmamiAuthValue;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
}): Promise<HttpResponse<T>> {
  const baseUrl = getBaseUrl(auth);
  const headers = await getAuthHeaders(auth);

  return await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${path}`,
    headers,
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
          placeholder: 'Please connect your account first.',
        };
      }
      try {
        const response = await umamiApiCall<{
          data: { id: string; name: string; domain: string }[];
        }>({
          auth: auth as UmamiAuthValue,
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
