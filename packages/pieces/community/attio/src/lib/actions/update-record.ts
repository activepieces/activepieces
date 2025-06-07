import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

// Array of attribute names that typically require array values in Attio
const MULTI_SELECT_ATTRIBUTES = ['email_addresses', 'phone_numbers', 'tags', 'companies'];

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record in Attio with new attribute values',
  auth: attioAuth,
  props: {
    object_type: Property.Dropdown({
      displayName: 'Object Type',
      description: 'The type of record to update (e.g., people, companies, deals)',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/objects'
          );

          if (!response?.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from objects endpoint');
          }

          return {
            options: response.data.map((object: any) => {
              return {
                label: object.plural_noun || object?.singular_noun,
                value: object.api_slug,
              };
            }),
          };
        } catch (error) {
          console.error('Error fetching object types:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching object types. Please check your API key.',
            options: [],
          };
        }
      },
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The unique identifier of the record to update',
      required: true,
    }),
    attributes: Property.Object({
      displayName: 'Updated Attributes',
      description: 'The attributes to update using exact API field names. Only provide the fields you want to change. For multi-select fields, you can provide either a single value or an array.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const { object_type, record_id, attributes } = propsValue;

      if (!object_type) {
        throw new Error('Object type is required');
      }

      if (!record_id) {
        throw new Error('Record ID is required');
      }

      if (!attributes || typeof attributes !== 'object') {
        throw new Error('Attributes must be a valid object');
      }

      const formattedValues: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(attributes)) {
        if (value === null || value === undefined || value === '') {
          continue;
        }

      if (MULTI_SELECT_ATTRIBUTES.includes(key) && typeof value === 'string') {
          formattedValues[key] = [value];
        } else if (key === 'email_addresses' && typeof value === 'string') {
          formattedValues[key] = [value];
        } else {
          formattedValues[key] = value;
        }
      }

      const response = await makeRequest(
        auth,
        HttpMethod.PATCH,
        `/objects/${object_type}/records/${record_id}`,
        {
          data: {
            values: formattedValues
          }
        }
      );

      if (!response?.data) {
        throw new Error('Invalid response from Attio API');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update record: ${errorMessage}`);
    }
  },
});
