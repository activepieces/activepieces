import { Property } from '@activepieces/pieces-framework';
import { clicdataApiCall } from './client';
import { clicdataAuth } from './auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const clicdataCommonProps = {
  apiVersion: Property.ShortText({
    displayName: 'API Version',
    required: false,
    description: 'Defaults to 2022.01',
  }),
  table_id: Property.Dropdown({
    auth: clicdataAuth,
    displayName: 'Table',
    description: 'Select the table to insert data into',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const response = await clicdataApiCall<{
          id: number;
          name: string;
          description?: string;
        }[]>({
          method: HttpMethod.GET,
          path: '/table',
          auth: auth,
          query: {
            page: 1,
            page_size: 100,
          },
          apiVersion: '2025.3',
        });

        return {
          disabled: false,
          options: response.result.map((table) => ({
            label: table.name,
            value: table.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load tables',
        };
      }
    },
  }),
};
