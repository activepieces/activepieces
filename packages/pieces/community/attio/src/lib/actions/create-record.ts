import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
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
      description: 'The type of record to create',
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

          return {
            options: response.data.map((object: any) => {
              return {
                label: object.plural_noun,
                value: object.api_slug,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error fetching object types',
            options: [],
          };
        }
      },
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: 'The attributes of the record. Use exact attribute names (API slugs) from your Attio workspace. Note: Some attributes like email_addresses, phone_numbers, etc. require array values - if you provide a string, it will be automatically converted to an array.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { object_type, attributes } = propsValue;

    // Process attributes to ensure they're properly formatted
    const formattedValues: Record<string, unknown> = {};

    // Copy attributes to formatted values, ensuring proper formatting for multi-select fields
    for (const [key, value] of Object.entries(attributes)) {
      if (MULTI_SELECT_ATTRIBUTES.includes(key) && typeof value === 'string') {
        // If this is a known multi-select field and a string was provided, wrap it in an array
        formattedValues[key] = [value];
      } else if (key === 'email_addresses' && typeof value === 'string') {
        // Special case for email_addresses which is very common
        formattedValues[key] = [value];
      } else {
        // Use the value as-is for other fields
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

    return response;
  },
});
