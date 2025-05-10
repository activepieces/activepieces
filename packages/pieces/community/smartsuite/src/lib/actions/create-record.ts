import { Property, createAction, HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-framework';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS, ERROR_MESSAGES } from '../common/constants';
import { handleSmartSuiteError, handleRateLimit, checkRateLimit } from '../common/utils';
import { SmartSuiteRecordFields } from '../common/types';

export const createRecord = createAction({
  name: 'create_record',
  displayName: 'Create a Record',
  description: 'Creates a new record in the specified table',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    fields: Property.DynamicProperties({
      displayName: 'Fields',
      description: 'Fields to set for the new record',
      required: true,
      refreshers: ['solution', 'table'],
      props: async ({ auth, solution, table }) => {
        if (!auth || !solution || !table) {
          return {};
        }

        try {
          if (!checkRateLimit()) {
            throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
          }

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.GET_APP.replace('{solutionId}', solution).replace('{appId}', table)}`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth,
            },
          });

          const fields: Record<string, any> = {};
          const appFields = response.body.fields || [];

          for (const field of appFields) {
            if (field.system) continue;

            let fieldConfig: any = {
              displayName: field.name,
              description: `Field ID: ${field.id}`,
              required: field.required,
            };

            switch (field.type) {
              case 'text':
              case 'email':
              case 'url':
              case 'phone':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.ShortText,
                };
                break;
              case 'long_text':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.LongText,
                };
                break;
              case 'number':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.Number,
                };
                break;
              case 'date':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.DateTime,
                };
                break;
              case 'checkbox':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.Checkbox,
                };
                break;
              case 'select':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.StaticDropdown,
                  options: {
                    disabled: false,
                    options: field.options.map((opt: any) => ({
                      label: opt.name,
                      value: opt.id,
                    })),
                  },
                };
                break;
              case 'multi_select':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.MultiSelectDropdown,
                  options: {
                    disabled: false,
                    options: field.options.map((opt: any) => ({
                      label: opt.name,
                      value: opt.id,
                    })),
                  },
                };
                break;
              case 'relation':
                fieldConfig = {
                  ...fieldConfig,
                  type: Property.ShortText,
                  description: `${fieldConfig.description}\nEnter the ID of the related record`,
                };
                break;
              default:
                continue;
            }

            fields[field.id] = fieldConfig;
          }

          return fields;
        } catch (error) {
          await handleRateLimit(error);
          console.error('Error fetching fields:', error);
          throw new Error(ERROR_MESSAGES.FIELD_FETCH_ERROR);
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { solution, table, fields } = propsValue;

    try {
      // Validate required fields
      const missingFields = Object.entries(fields)
        .filter(([_, value]) => value.required && !value.value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Format fields for API
      const formattedFields: SmartSuiteRecordFields = {};
      for (const [fieldId, value] of Object.entries(fields)) {
        if (value.value !== undefined && value.value !== null) {
          formattedFields[fieldId] = value.value;
        }
      }

      if (!checkRateLimit()) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.CREATE_RECORD.replace('{solutionId}', solution).replace('{appId}', table)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
        body: {
          fields: formattedFields,
        },
      });

      return response.body;
    } catch (error) {
      await handleRateLimit(error);
      if (error instanceof Error) {
        throw new Error(`Failed to create record: ${error.message}`);
      }
      throw handleSmartSuiteError(error);
    }
  },
}); 