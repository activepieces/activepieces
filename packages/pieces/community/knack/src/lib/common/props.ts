import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall, KnackAuthProps } from './client';

interface KnackObject {
  key: string;
  name: string;
}

export interface KnackGetObjectResponse {
  object: {
    fields: {
      type: string;
      key: string;
      name: string;
      format: {
        type: string;
        options: string[];
      };
    }[];
  };
}

export const objectDropdown = Property.Dropdown({
  displayName: 'Object',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first.',
        options: [],
      };
    }

    const typedAuth = auth as KnackAuthProps;

    try {
      const response = await knackApiCall<{ objects: KnackObject[] }>({
        method: HttpMethod.GET,
        auth: typedAuth,
        resourceUri: '/objects',
      });

      return {
        disabled: false,
        options: response.objects.map((object) => ({
          label: object.name,
          value: object.key,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: `Error loading objects: ${error.message}`,
        options: [],
      };
    }
  },
});

export const fieldIdDropdown = Property.Dropdown({
  displayName: 'Field ID',
  required: true,
  description:'Field to find the record by',
  refreshers: ['object'],
  options: async ({ auth, object }) => {
    if (!auth || !object) {
      return {
        disabled: true,
        placeholder: 'Please select an object first.',
        options: [],
      };
    }
    const typedAuth = auth as KnackAuthProps;

    try {
      const response = await knackApiCall<KnackGetObjectResponse>({
        method: HttpMethod.GET,
        auth: typedAuth,
        resourceUri: `/objects/${object}`,
      });

      return {
        disabled: false,
        options: response.object.fields.map((field) => ({
          label: field.name,
          value: field.key,
        })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        placeholder: `Error loading objects: ${error.message}`,
        options: [],
      };
    }
  },
});

export const recordFields = Property.DynamicProperties({
  displayName: 'Record Fields',
  refreshers: ['object'],
  required: true,
  props: async ({ auth, object }) => {
    if (!auth || !object) {
      return {};
    }

    const props: DynamicPropsValue = {};

    const typedAuth = auth as KnackAuthProps;

    const response = await knackApiCall<KnackGetObjectResponse>({
      method: HttpMethod.GET,
      auth: typedAuth,
      resourceUri: `/objects/${object}`,
    });

    for (const field of response.object.fields) {
      switch (field.type) {
        case 'short_text':
        case 'email':
        case 'phone':
        case 'link':
          props[field.key] = Property.ShortText({
            displayName: field.name,
            required: false,
          });
          break;
        case 'paragraph_text':
        case 'address':
        case 'rich_text':
          props[field.key] = Property.LongText({
            displayName: field.name,
            required: false,
          });
          break;
        case 'number':
        case 'rating':
        case 'currency':
          props[field.key] = Property.Number({
            displayName: field.name,
            required: false,
          });
          break;
        case 'multiple_choice': {
          const options = field.format.options.map((option) => ({
            label: option,
            value: option,
          }));
          props[field.key] =
            field.format.type === 'multi'
              ? Property.StaticMultiSelectDropdown({
                  displayName: field.name,
                  required: false,
                  options: {
                    options,
                  },
                })
              : Property.StaticDropdown({
                  displayName: field.name,
                  required: false,
                  options: { options },
                });
          break;
        }
        case 'boolean':
          props[field.key] = Property.Checkbox({
            displayName: field.name,
            required: false,
          });
          break;
      }
    }
    return props;
  },
});

export function knackTransformFields(
  objectDetails: KnackGetObjectResponse,
  recordFields: Record<string, any>
): Record<string, any> {
  const fields = objectDetails.object.fields;

  const keyToNameMap: Record<string, string> = {};
  for (const field of fields) {
    if (field && field.key && field.name) {
      keyToNameMap[field.key] = field.name;
    }
  }

  const transformed: Record<string, any> = {};

  for (const [key, value] of Object.entries(recordFields)) {
    const isRaw = key.endsWith('_raw');
    const baseKey = isRaw ? key.slice(0, -4) : key;

    const fieldName = keyToNameMap[baseKey];
    if (fieldName) {
      const transformedKey = isRaw ? `${fieldName} raw` : fieldName;
      transformed[transformedKey] = value;
    } else {
      transformed[key] = value;
    }
  }

  return transformed;
}
