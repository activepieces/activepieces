import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { API_ENDPOINTS, SMARTSUITE_API_URL, SMARTSUITE_WEBHOOKS_API_URL } from './constants';

export const smartsuiteCommon = {
  solution: Property.Dropdown({
    displayName: 'Solution',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please enter your API key first'
        };
      }

      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.LIST_SOLUTIONS}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });

        return {
          disabled: false,
          options: response.body.items.map((solution: any) => {
            return {
              label: solution.name,
              value: solution.id,
            };
          }),
        };
      } catch (error) {
        console.error('Error fetching solutions:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching solutions. Please check your API key.'
        };
      }
    },
  }),

  table: Property.Dropdown({
    displayName: 'Table',
    required: true,
    refreshers: ['solution'],
    options: async ({ auth, solution }) => {
      if (!auth || !solution) {
        return {
          disabled: true,
          options: [],
          placeholder: solution ? 'Please select a solution first' : 'Please enter your API key first'
        };
      }

      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.LIST_APPS.replace('{solutionId}', solution as string)}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });

        return {
          disabled: false,
          options: response.body.items.map((app: any) => {
            return {
              label: app.name,
              value: app.id,
            };
          }),
        };
      } catch (error) {
        console.error('Error fetching tables:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching tables. Please check your permissions.'
        };
      }
    },
  }),

  record: Property.Dropdown({
    displayName: 'Record',
    required: true,
    refreshers: ['solution', 'table'],
    options: async ({ auth, solution, table }) => {
      if (!auth || !solution || !table) {
        return {
          disabled: true,
          options: [],
          placeholder: !solution ? 'Please select a solution first' : !table ? 'Please select a table first' : 'Please enter your API key first'
        };
      }

      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.LIST_RECORDS
            .replace('{solutionId}', solution as string)
            .replace('{appId}', table as string)}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          body: {},
        });

        return {
          disabled: false,
          options: response.body.items.map((record: any) => {
            return {
              label: record.title || `Record ${record.id}`,
              value: record.id,
            };
          }),
        };
      } catch (error) {
        console.error('Error fetching records:', error);
        return {
          disabled: true,
          options: [],
          placeholder: 'Error fetching records. Please check your permissions.'
        };
      }
    },
  }),

  async getTableFields(auth: string, solutionId: string, tableId: string) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.GET_APP
          .replace('{solutionId}', solutionId)
          .replace('{appId}', tableId)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return response.body.fields;
    } catch (error) {
      console.error('Error fetching table fields:', error);
      throw error;
    }
  },

  tableFields: Property.DynamicProperties({
    displayName: 'Fields',
    required: true,
    refreshers: ['solution', 'table'],
    props: async ({ auth, solution, table }) => {
      if (!auth || !solution || !table) {
        return {};
      }

      try {
        const fields = await smartsuiteCommon.getTableFields(
          auth as unknown as string,
          solution as unknown as string,
          table as unknown as string
        );

        const fieldProperties: Record<string, any> = {};

        fields.forEach((field: any) => {
          // Skip system fields
          if (field.system) return;

          switch (field.type) {
            case 'text':
            case 'email':
            case 'url':
            case 'phone':
              fieldProperties[field.id] = Property.ShortText({
                displayName: field.name,
                required: field.required,
              });
              break;
            case 'number':
              fieldProperties[field.id] = Property.Number({
                displayName: field.name,
                required: field.required,
              });
              break;
            case 'date':
              fieldProperties[field.id] = Property.DateTime({
                displayName: field.name,
                required: field.required,
              });
              break;
            case 'checkbox':
              fieldProperties[field.id] = Property.Checkbox({
                displayName: field.name,
                required: field.required,
              });
              break;
            case 'long_text':
              fieldProperties[field.id] = Property.LongText({
                displayName: field.name,
                required: field.required,
              });
              break;
            default:
              fieldProperties[field.id] = Property.ShortText({
                displayName: `${field.name} (${field.type})`,
                required: field.required,
              });
          }
        });

        return fieldProperties;
      } catch (error) {
        console.error('Error building field properties:', error);
        return {};
      }
    },
  }),
};

export function formatRecordFields(fields: DynamicPropsValue): Record<string, any> {
  const formattedFields: Record<string, any> = {};

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formattedFields[key] = value;
    }
  });

  return formattedFields;
}
