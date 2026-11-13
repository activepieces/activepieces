import { Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall, KnackAuthValue } from './client';
import { knackAuth } from './auth';

export const objectDropdown = Property.Dropdown({
  displayName: 'Object',
  required: true,
  refreshers: [],
  auth: knackAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please authenticate first.',
        options: [],
      };
    }
    try {
      const objects = await knackListObjects({ auth });
      return {
        disabled: false,
        options: objects.map((object) => ({
          label: object.name,
          value: object.key,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: `Error loading objects: ${errorText(error)}`,
        options: [],
      };
    }
  },
});

export const fieldIdDropdown = Property.Dropdown({
  auth: knackAuth,
  displayName: 'Field ID',
  required: true,
  description: 'Field to find the record by',
  refreshers: ['object'],
  options: async ({ auth, object }) => {
    if (!auth || typeof object !== 'string' || object.length === 0) {
      return {
        disabled: true,
        placeholder: 'Please select an object first.',
        options: [],
      };
    }
    try {
      const response = await knackGetObject({ auth, objectKey: object });
      return {
        disabled: false,
        options: response.object.fields.map((field) => ({
          label: field.name,
          value: field.key,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: `Error loading fields: ${errorText(error)}`,
        options: [],
      };
    }
  },
});

export const recordFields = Property.DynamicProperties({
  auth: knackAuth,
  displayName: 'Record Fields',
  refreshers: ['object'],
  required: true,
  props: async ({ auth, object }) => {
    if (!auth || typeof object !== 'string' || object.length === 0) {
      return {};
    }
    const props: DynamicPropsValue = {};
    const response = await knackGetObject({ auth, objectKey: object });
    const fields: KnackField[] = response.object.fields ?? [];

    for (const field of fields) {
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
          const options = (field.format?.options ?? []).map((option) => ({
            label: option,
            value: option,
          }));
          props[field.key] =
            field.format?.type === 'multi' || field.format?.type === 'checkboxes'
              ? Property.StaticMultiSelectDropdown({
                  displayName: field.name,
                  required: false,
                  options: { options },
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
        case 'date_time':
          props[field.key] = Property.DateTime({
            displayName: field.name,
            required: false,
          });
          break;
        default:
          if (!READ_ONLY_FIELD_TYPES.includes(field.type)) {
            props[field.key] = Property.Json({
              displayName: `${field.name} (${field.type})`,
              description: 'Value in the format Knack expects for this field type, as JSON.',
              required: false,
            });
          }
          break;
      }
    }
    return props;
  },
});

export async function knackListObjects({ auth }: { auth: KnackAuthValue }): Promise<KnackObjectSummary[]> {
  const response = await knackApiCall<{ objects: KnackObjectSummary[] }>({
    method: HttpMethod.GET,
    auth,
    resourceUri: '/objects',
  });
  return response.objects ?? [];
}

export async function knackGetObject({
  auth,
  objectKey,
}: {
  auth: KnackAuthValue;
  objectKey: string;
}): Promise<KnackGetObjectResponse> {
  return knackApiCall<KnackGetObjectResponse>({
    method: HttpMethod.GET,
    auth,
    resourceUri: `/objects/${encodeURIComponent(objectKey)}`,
  });
}

export function knackTransformFields(
  objectDetails: KnackGetObjectResponse,
  record: Record<string, unknown>
): Record<string, unknown> {
  const keyToNameMap: Record<string, string> = {};
  for (const field of objectDetails.object.fields) {
    if (field && field.key && field.name) {
      keyToNameMap[field.key] = field.name;
    }
  }

  const transformed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const isRaw = key.endsWith('_raw');
    const baseKey = isRaw ? key.slice(0, -4) : key;
    const fieldName = keyToNameMap[baseKey];
    if (fieldName) {
      transformed[isRaw ? `${fieldName} raw` : fieldName] = value;
    } else {
      transformed[key] = value;
    }
  }
  return transformed;
}

export function splitKnackRecord(record: Record<string, unknown>): KnackSplitRecord {
  const { id, ...fields } = record;
  return { id: typeof id === 'string' ? id : String(id ?? ''), fields };
}

export function parseFieldsObject(value: unknown): Record<string, unknown> {
  const parsed: unknown = typeof value === 'string' ? safeJsonParse(value) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Fields must be a JSON object keyed by Knack field key, e.g. {"field_1": "value"}.');
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(parsed)) {
    result[key] = entry;
  }
  return result;
}

export function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Value is not valid JSON.');
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const READ_ONLY_FIELD_TYPES = [
  'auto_increment',
  'equation',
  'concatenation',
  'sum',
  'count',
  'min',
  'max',
  'average',
  'user_roles',
];

export type KnackObjectSummary = {
  key: string;
  name: string;
};

export type KnackField = {
  type: string;
  key: string;
  name: string;
  required?: boolean;
  unique?: boolean;
  format?: {
    type?: string;
    options?: string[];
  };
};

export type KnackGetObjectResponse = {
  object: {
    key?: string;
    name?: string;
    fields: KnackField[];
  };
};

export type KnackSplitRecord = {
  id: string;
  fields: Record<string, unknown>;
};
