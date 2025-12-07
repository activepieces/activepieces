import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://a.klaviyo.com/api';
const API_REVISION = '2024-10-15';

export const escapeFilterValue = (value: string): string => {
  return value.replace(/"/g, '\\"');
};

export const klaviyoCommon = {
  baseUrl: BASE_URL,

  // Helper to make authenticated API calls
  makeRequest: async (
    apiKey: string,
    method: HttpMethod,
    endpoint: string,
    body?: any
  ) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    return await httpClient.sendRequest({
      method,
      url,
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': API_REVISION,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
    });
  },

  // List dropdown
  listDropdown: Property.Dropdown({
    displayName: 'List',
    description: 'Select a Klaviyo list',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const response = await klaviyoCommon.makeRequest(
          auth as string,
          HttpMethod.GET,
          '/lists'
        );

        const lists = response.body.data || [];
        const options = lists.map((list: any) => ({
          label: list.attributes?.name || list.id,
          value: list.id,
        }));

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load lists',
        };
      }
    },
  }),

  // Segment dropdown
  segmentDropdown: Property.Dropdown({
    displayName: 'Segment',
    description: 'Select a Klaviyo segment',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const response = await klaviyoCommon.makeRequest(
          auth as string,
          HttpMethod.GET,
          '/segments'
        );

        const segments = response.body.data || [];
        const options = segments.map((segment: any) => ({
          label: segment.attributes?.name || segment.id,
          value: segment.id,
        }));

        return {
          disabled: false,
          options,
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load segments',
        };
      }
    },
  }),
};
