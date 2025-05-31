import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

// Array of attribute names that typically require array values in Attio
const MULTI_SELECT_ATTRIBUTES = ['email_addresses', 'phone_numbers', 'tags', 'companies'];

export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in Attio (e.g., person, company, or deal)',
  auth: attioAuth,
  props: {
    object_type: Property.Dropdown({
      displayName: 'Object Type',
      description: 'The type of record to create (e.g., people, companies, deals)',
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
    attributes: Property.Object({
      displayName: 'Record Attributes',
      description: 'The attributes of the record using exact API field names.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const { object_type, attributes } = propsValue;

      if (!object_type) {
        throw new Error('Object type is required');
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
        HttpMethod.POST,
        `/objects/${object_type}/records`,
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
      throw new Error(`Failed to create record: ${errorMessage}`);
    }
  },
});
