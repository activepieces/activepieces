import {
  DynamicPropsValue,
  DropdownState,
  Property,
} from '@activepieces/pieces-framework';
import {
  baserowAuth,
  BaserowAuthValue,
} from '../auth';
import { BaserowClient } from './client';
import { BaserowFieldType } from './constants';

export async function makeClient(
  auth: BaserowAuthValue
): Promise<BaserowClient> {
  return new BaserowClient(auth.props.apiUrl, `Token ${auth.props.token}`);
}

export function formatFieldValues(
  input: DynamicPropsValue,
  fieldTypeMap: Record<string, string>,
  options: { skipEmpty: boolean }
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    const value = input[key];
    const fieldType = fieldTypeMap[key];

    if (options.skipEmpty) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
    }

    switch (fieldType) {
      case BaserowFieldType.LINK_TO_TABLE:
        if (Array.isArray(value) && value.length > 0) {
          result[key] = value.map((id: string) => parseInt(id, 10));
        } else {
          result[key] = [];
        }
        break;
      case BaserowFieldType.MULTIPLE_COLLABORATORS:
        if (Array.isArray(value) && value.length > 0) {
          result[key] = value.map((id: string) => ({ id: parseInt(id, 10) }));
        } else {
          result[key] = [];
        }
        break;
      case BaserowFieldType.SINGLE_SELECT:
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          result[key] = options.skipEmpty ? undefined : null;
        } else {
          result[key] = value;
        }
        break;
      case BaserowFieldType.MULTI_SELECT:
        if (value === null || value === undefined || value === '') {
          result[key] = options.skipEmpty ? undefined : [];
        } else {
          result[key] = value;
        }
        break;
      default:
        if (value === null || value === undefined) {
          result[key] = options.skipEmpty ? undefined : null;
        } else {
          result[key] = value;
        }
        break;
    }
  }
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }
  return result;
}

export const baserowCommon = {
  tableId: (required = true) =>
    Property.Dropdown({
      displayName: 'Table',
      description: 'Select the table.',
      required,
      auth: baserowAuth,
      refreshers: ['auth'],
      options: async ({ auth }): Promise<DropdownState<number>> => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first.',
            options: [],
          };
        }
        const client = await makeClient(auth);
        const tables = await client.listTables();
        return {
          disabled: false,
          options: tables.map((t) => ({ label: t.name, value: t.id })),
        };
      },
    }),
  rowId: (required = true) =>
    Property.Dropdown({
      displayName: 'Row',
      description: 'Select the row.',
      required,
      auth: baserowAuth,
      refreshers: ['auth', 'table_id'],
      options: async ({ auth, table_id }): Promise<DropdownState<number>> => {
        if (!auth || typeof table_id !== 'number') {
          return {
            disabled: true,
            placeholder: 'Select a table first.',
            options: [],
          };
        }
        const client = await makeClient(auth);
        const response = (await client.listRows(
          table_id,
          undefined,
          200
        )) as { results: Record<string, unknown>[] };
        return {
          disabled: false,
          options: response.results.map((row) => {
            const primaryValue = Object.entries(row)
              .filter(([k]) => k !== 'id' && k !== 'order')
              .map(([, v]) => (typeof v === 'string' && v ? v : null))
              .find(Boolean);
            const label = primaryValue
              ? `#${row['id']} ${primaryValue}`
              : `Row #${row['id']}`;
            return { label, value: row['id'] as number };
          }),
        };
      },
    }),
  tableFields: (required = true) =>
    Property.DynamicProperties({
      auth: baserowAuth,
      displayName: 'Table Fields',
      required,
      refreshers: ['table_id'],
      props: async ({ auth, table_id }) => {
        if (!auth || typeof table_id !== 'number') return {};

        const fields: DynamicPropsValue = {};
        try {
          const client = await makeClient(auth);
          const tableFields = await client.listTableFields(table_id);
          for (const field of tableFields) {
            if (
              !field.read_only &&
              ![BaserowFieldType.FILE].includes(field.type)
            ) {
              switch (field.type) {
                case BaserowFieldType.BOOLEAN:
                  fields[field.name] = Property.Checkbox({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.RATING:
                  fields[field.name] = Property.Number({
                    displayName: field.name,
                    required: false,
                    description: `Enter valid value between 1 and ${field.max_value}.`,
                  });
                  break;
                case BaserowFieldType.DATE:
                  fields[field.name] = Property.DateTime({
                    displayName: field.name,
                    required: false,
                    description: `Enter date in ${field.date_format} format ${
                      field.date_include_time
                        ? 'and time in ' + field.date_time_format + ' hour format'
                        : ''
                    }.`,
                  });
                  break;
                case BaserowFieldType.DURATION:
                  fields[field.name] = Property.Number({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.LINK_TO_TABLE:
                  fields[field.name] = Property.Array({
                    displayName: field.name,
                    required: false,
                    description: `Enter row ids from table(ID: ${field.link_row_table_id}) that you want to link to.`,
                  });
                  break;
                case BaserowFieldType.LONG_TEXT:
                  fields[field.name] = Property.LongText({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.MULTIPLE_COLLABORATORS:
                  fields[field.name] = Property.Array({
                    displayName: field.name,
                    required: false,
                    description: 'Enter user ids that you want to link to.',
                  });
                  break;
                case BaserowFieldType.SINGLE_SELECT:
                  fields[field.name] = Property.StaticDropdown({
                    displayName: field.name,
                    required: false,
                    options: {
                      disabled: false,
                      options: field.select_options.map((option) => {
                        return {
                          label: option.value,
                          value: option.value,
                        };
                      }),
                    },
                  });
                  break;
                case BaserowFieldType.MULTI_SELECT:
                  fields[field.name] = Property.StaticMultiSelectDropdown({
                    displayName: field.name,
                    required: false,
                    options: {
                      disabled: false,
                      options: field.select_options.map((option) => {
                        return {
                          label: option.value,
                          value: option.value,
                        };
                      }),
                    },
                  });
                  break;
                case BaserowFieldType.NUMBER:
                  fields[field.name] = Property.Number({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.EMAIL:
                case BaserowFieldType.PHONE_NUMBER:
                  fields[field.name] = Property.ShortText({
                    displayName: field.name,
                    required: false,
                  });
                  break;
                case BaserowFieldType.TEXT:
                  fields[field.name] = Property.ShortText({
                    displayName: field.name,
                    required: false,
                    defaultValue: field.text_default,
                  });
                  break;
                case BaserowFieldType.URL:
                  fields[field.name] = Property.ShortText({
                    displayName: field.name,
                    required: false,
                  });
                  break;
              }
            }
          }
        } catch (error) {
          console.log('Invalid Baserow Table ID.');
        }
        return fields;
      },
    }),
};
