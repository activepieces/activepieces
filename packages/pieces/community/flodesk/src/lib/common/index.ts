import {
  HttpRequest,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { SecretTextConnectionValue } from '@activepieces/shared';
import { flodeskAuth } from '../auth';

export async function flodeskApiCall<T>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: any;
  queryParams?: QueryParams;
}) {
  const credentials = Buffer.from(`${apiKey}:`).toString('base64');
  const request: HttpRequest = {
    method,
    url: `https://api.flodesk.com/v1${endpoint}`,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Activepieces (https://www.activepieces.com)',
    },
    queryParams,
    body,
  };
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export const flodeskCommon = {
  segment_id: (required = true) => Property.Dropdown({
    auth: flodeskAuth,
    displayName: 'Segment',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Flodesk account first',
        };
      }
      try {
        const response = await flodeskApiCall<{
          data: { id: string; name: string }[];
        }>({
          apiKey: (auth as SecretTextConnectionValue).secret_text,
          method: HttpMethod.GET,
          endpoint: '/segments',
        });
        const options = response.data.map((segment) => ({
          label: segment.name,
          value: segment.id,
        }));
        return {
          disabled: false,
          options,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading segments',
        };
      }
    },
  }),
  segments_multi: (required = false) => Property.MultiSelectDropdown({
    auth: flodeskAuth,
    displayName: 'Segments',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Flodesk account first',
        };
      }
      try {
        const response = await flodeskApiCall<{
          data: { id: string; name: string }[];
        }>({
          apiKey: (auth as SecretTextConnectionValue).secret_text,
          method: HttpMethod.GET,
          endpoint: '/segments',
        });
        const options = response.data.map((segment) => ({
          label: segment.name,
          value: segment.id,
        }));
        return {
          disabled: false,
          options,
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading segments',
        };
      }
    },
  }),
};
