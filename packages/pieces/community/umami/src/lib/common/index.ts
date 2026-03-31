import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { umamiAuth } from '../..';

interface UmamiAuthProps {
  base_url: string;
  auth_mode: string;
  username?: string;
  password?: string;
  api_key?: string;
}

export async function resolveAuthHeaders(
  auth: UmamiAuthProps,
): Promise<Record<string, string>> {
  const baseUrl = auth.base_url.replace(/\/+$/, '');

  if (auth.auth_mode === 'cloud') {
    return { 'x-umami-api-key': auth.api_key ?? '' };
  }

  const loginResponse = await httpClient.sendRequest<{ token: string }>({
    method: HttpMethod.POST,
    url: `${baseUrl}/api/auth/login`,
    body: {
      username: auth.username,
      password: auth.password,
    },
  });

  return { Authorization: `Bearer ${loginResponse.body.token}` };
}

export async function umamiApiCall<T extends HttpMessageBody>({
  serverUrl,
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  serverUrl: string;
  auth: UmamiAuthProps;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  const baseUrl = serverUrl.replace(/\/+$/, '');
  const headers = await resolveAuthHeaders(auth);
  return await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}/api${path}`,
    headers,
    queryParams,
    body,
  });
}

function extractAuth(auth: unknown): UmamiAuthProps {
  return (auth as { props: UmamiAuthProps }).props;
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
      const authProps = extractAuth(auth);
      try {
        const response = await umamiApiCall<{ data: { id: string; name: string; domain: string }[] }>({
          serverUrl: authProps.base_url,
          auth: authProps,
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
