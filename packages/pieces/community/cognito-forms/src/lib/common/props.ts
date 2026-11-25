import { HttpMethod } from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { cognitoRequest, isRecord } from './client';
import { ENTRY_META_KEYS, formPath, listForms } from './entries';

export const formIdDropdown = Property.Dropdown({
  auth: cognitoFormsAuth,
  displayName: 'Form',
  description: 'Pick the form. Only forms the API key has access to are listed.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Please connect your Cognito Forms account first', options: [] };
    }
    try {
      const forms = await listForms(auth.secret_text);
      const options = forms
        .filter((form) => form.Id !== undefined)
        .map((form) => ({ label: form.Name ?? form.InternalName ?? String(form.Id), value: String(form.Id) }));
      if (options.length === 0) {
        return { disabled: true, placeholder: 'No forms found for this API key', options: [] };
      }
      return { disabled: false, options };
    } catch (error) {
      return {
        disabled: true,
        placeholder: error instanceof Error ? error.message.slice(0, 200) : 'Could not load forms',
        options: [],
      };
    }
  },
});

export const formIdText = Property.ShortText({
  displayName: 'Form ID',
  description: 'The form ID or internal name, as returned by "List Forms".',
  required: true,
});

export const entryIdText = (description: string) =>
  Property.ShortText({
    displayName: 'Entry ID',
    description,
    required: true,
  });

export const entryFieldsJson = (description: string) =>
  Property.Json({
    displayName: 'Fields',
    description,
    required: true,
  });

export const formFields = fieldsProp({ forUpdate: false });

export const updateFormFields = fieldsProp({ forUpdate: true });

function fieldsProp({ forUpdate }: { forUpdate: boolean }) {
  return Property.DynamicProperties({
    displayName: 'Fields',
    auth: cognitoFormsAuth,
    refreshers: ['formId'],
    required: true,
    props: async ({ auth, formId }) => {
      if (!auth || typeof formId !== 'string' || formId.length === 0) {
        return {};
      }
      const schema = await cognitoRequest<unknown>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: `${formPath(formId)}/schema`,
      });
      return buildFieldProps({ schema, forUpdate });
    },
  });
}

export function buildFieldProps({ schema, forUpdate = false }: { schema: unknown; forUpdate?: boolean }): DynamicPropsValue {
  const props: DynamicPropsValue = {};
  for (const field of readSchemaFields(schema)) {
    if (field.readOnly) {
      continue;
    }
    const displayName = field.title ?? field.description ?? field.name;
    const description = field.title && field.description ? field.description : '';
    if (field.enumValues.length > 0 && field.type === 'string') {
      props[field.name] = Property.StaticDropdown({
        displayName,
        description,
        required: false,
        options: { disabled: false, options: field.enumValues.map((value) => ({ label: value, value })) },
      });
      continue;
    }
    switch (field.type) {
      case 'string':
        props[field.name] = Property.ShortText({ displayName, description, required: false });
        break;
      case 'boolean':
        props[field.name] = forUpdate
          ? Property.StaticDropdown({
              displayName,
              description: description || 'Leave empty to keep the current value.',
              required: false,
              options: {
                disabled: false,
                options: [
                  { label: 'Yes', value: true },
                  { label: 'No', value: false },
                ],
              },
            })
          : Property.Checkbox({ displayName, description, required: false });
        break;
      case 'number':
      case 'integer':
        props[field.name] = Property.Number({ displayName, description, required: false });
        break;
      default:
        props[field.name] = Property.Json({
          displayName,
          description: `${description ? `${description} ` : ''}Enter this field as JSON (for example a name, address, choice list or table rows).`,
          required: false,
        });
        break;
    }
  }
  return props;
}


export function readSchemaFields(schema: unknown): SchemaField[] {
  if (!isRecord(schema) || !isRecord(schema['properties'])) {
    return [];
  }
  const required = Array.isArray(schema['required'])
    ? schema['required'].filter((item): item is string => typeof item === 'string')
    : [];
  const fields: SchemaField[] = [];
  for (const [name, value] of Object.entries(schema['properties'])) {
    if (!isRecord(value) || ENTRY_META_KEYS.has(name)) {
      continue;
    }
    fields.push({
      name,
      type: readType(value),
      title: typeof value['title'] === 'string' ? value['title'] : undefined,
      description: typeof value['description'] === 'string' ? value['description'] : undefined,
      readOnly: value['readOnly'] === true,
      required: required.includes(name),
      enumValues: Array.isArray(value['enum'])
        ? value['enum'].filter((item): item is string => typeof item === 'string')
        : [],
    });
  }
  return fields;
}

function readType(value: Record<string, unknown>): string {
  const type = value['type'];
  if (typeof type === 'string') {
    return type;
  }
  if (Array.isArray(type)) {
    const first = type.find((item): item is string => typeof item === 'string' && item !== 'null');
    return first ?? 'object';
  }
  return 'object';
}

export type SchemaField = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  readOnly: boolean;
  required: boolean;
  enumValues: string[];
};
