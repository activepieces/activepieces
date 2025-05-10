import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { API_ENDPOINTS, SMARTSUITE_API_URL, FIELD_TYPES, ERROR_MESSAGES } from './constants';
import { SmartSuiteField, SmartSuiteError } from './types';

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
          options: response.body.items.map((solution: any) => ({
            label: solution.name,
            value: solution.id,
          })),
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
          url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.LIST_TABLES.replace('{solutionId}', solution as string)}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });

        return {
          disabled: false,
          options: response.body.items.map((app: any) => ({
            label: app.name,
            value: app.id,
          })),
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
          options: response.body.items.map((record: any) => ({
            label: record.title || `Record ${record.id}`,
            value: record.id,
          })),
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

  async getTableFields(auth: string, solutionId: string, tableId: string): Promise<SmartSuiteField[]> {
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

        fields.forEach((field: SmartSuiteField) => {
          // Skip system fields
          if (field.system) return;

          switch (field.type) {
            case FIELD_TYPES.TEXT:
            case FIELD_TYPES.EMAIL:
            case FIELD_TYPES.URL:
            case FIELD_TYPES.PHONE:
              fieldProperties[field.id] = Property.ShortText({
                displayName: field.name,
                required: field.required,
              });
              break;
            case FIELD_TYPES.NUMBER:
              fieldProperties[field.id] = Property.Number({
                displayName: field.name,
                required: field.required,
              });
              break;
            case FIELD_TYPES.DATE:
              fieldProperties[field.id] = Property.DateTime({
                displayName: field.name,
                required: field.required,
              });
              break;
            case FIELD_TYPES.CHECKBOX:
              fieldProperties[field.id] = Property.Checkbox({
                displayName: field.name,
                required: field.required,
              });
              break;
            case FIELD_TYPES.LONG_TEXT:
              fieldProperties[field.id] = Property.LongText({
                displayName: field.name,
                required: field.required,
              });
              break;
            case FIELD_TYPES.SELECT:
            case FIELD_TYPES.MULTI_SELECT:
              fieldProperties[field.id] = Property.StaticDropdown({
                displayName: field.name,
                required: field.required,
                options: {
                  options: field.options?.map((option: any) => ({
                    label: option.label,
                    value: option.value,
                  })) || [],
                },
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

export function handleSmartSuiteError(error: any): SmartSuiteError {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.body?.message || ERROR_MESSAGES.INVALID_REQUEST;

    switch (status) {
      case 400:
        return { status, message: ERROR_MESSAGES.INVALID_REQUEST, details: error.response.body };
      case 401:
        return { status, message: ERROR_MESSAGES.INVALID_API_KEY };
      case 403:
        return { status, message: ERROR_MESSAGES.PERMISSION_DENIED };
      case 404:
        return { status, message: ERROR_MESSAGES.RESOURCE_NOT_FOUND };
      case 413:
        return { status, message: ERROR_MESSAGES.FILE_TOO_LARGE };
      case 422:
        return { status, message: ERROR_MESSAGES.INVALID_REQUEST, details: error.response.body };
      case 429:
        return { status, message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED };
      default:
        return { status, message: 'An unexpected error occurred' };
    }
  }

  return { status: 500, message: error.message || 'An unexpected error occurred' };
} 