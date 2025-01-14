import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";
import { Table } from "@activepieces/shared";

export const tablesCommon = {
  table_name: Property.Dropdown({
    displayName: 'Table Name',
    description: 'The name of the table to insert records into.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async (propsValue, context) => {
      try {
        const res = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${context.server.apiUrl}v1/tables`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.server.token,
          },
        });

        const tables = res.body;
        if (!Array.isArray(tables) || tables.length === 0) {
          return {
            options: [],
            disabled: true,
            placeholder: 'No tables found. Please create a table first.',
          };
        }

        return {
          options: tables.map((table: Table) => ({ label: table.name, value: table.id })),
        };
      } catch (e) {
        console.error('Error fetching tables:', e);
        return {
          options: [],
          disabled: true,
          placeholder: 'Error loading tables. Please try again.',
        };
      }
    },
  }),
}