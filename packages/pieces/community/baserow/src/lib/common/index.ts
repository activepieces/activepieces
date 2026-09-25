import {
  DynamicPropsValue,
  DropdownState,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { tryCatch, unique } from '@activepieces/pieces-framework';
import {
  baserowAuth,
  BaserowAuthValue,
  baserowAuthHelpers,
} from '../auth';
import { BaserowClient } from './client';
import { BaserowFieldType, BaserowLinkBy } from './constants';
import { BaserowField } from './types';

export async function makeClient(
  auth: BaserowAuthValue
): Promise<BaserowClient> {
  const { apiUrl, token, email, password } = auth.props;
  if (baserowAuthHelpers.isJwtAuth(auth)) {
    if (!email || !password) {
      throw new Error(
        'Email and Password are required for JWT authentication. Update your Baserow connection.'
      );
    }
    const jwt = await BaserowClient.getJwtToken({ apiUrl, email, password });
    return new BaserowClient(apiUrl, `JWT ${jwt}`, true);
  }
  if (!token) {
    throw new Error(
      'Database Token is required for Database Token authentication. Update your Baserow connection.'
    );
  }
  return new BaserowClient(apiUrl, `Token ${token}`);
}

export function formatFieldValues({
  input,
  fields,
  skipEmpty,
}: {
  input: DynamicPropsValue;
  fields: BaserowField[];
  skipEmpty: boolean;
}): Record<string, unknown> {
  const fieldsByName = new Map(fields.map((field) => [field.name, field]));
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (isLinkByKey({ key, fieldsByName })) continue;
    const value = input[key];
    const field = fieldsByName.get(key);

    if (skipEmpty) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
    }

    switch (field?.type) {
      case BaserowFieldType.LINK_TO_TABLE: {
        const references = toLinkedRowReferences({
          fieldName: key,
          value,
          linkBy: readLinkBy(input[linkByKey(key)]),
        });
        if (references.length > 0 || !skipEmpty) {
          result[key] = references;
        }
        break;
      }
      case BaserowFieldType.DATE:
        if (value === null || value === undefined) {
          result[key] = skipEmpty ? undefined : null;
        } else {
          result[key] = field.date_include_time ? value : toDateOnly(value);
        }
        break;
      case BaserowFieldType.MULTIPLE_COLLABORATORS: {
        const collaborators = toFieldItems({ value, objectKey: 'id' }).map((item) => ({
          id: toCollaboratorId({ fieldName: key, item }),
        }));
        if (collaborators.length > 0 || !skipEmpty) {
          result[key] = collaborators;
        }
        break;
      }
      case BaserowFieldType.SINGLE_SELECT:
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          result[key] = skipEmpty ? undefined : null;
        } else {
          result[key] = value;
        }
        break;
      case BaserowFieldType.MULTI_SELECT:
        if (value === null || value === undefined || value === '') {
          result[key] = skipEmpty ? undefined : [];
        } else {
          result[key] = value;
        }
        break;
      default:
        if (value === null || value === undefined) {
          result[key] = skipEmpty ? undefined : null;
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

export async function ensureSelectOptionsExist({
  fields,
  payload,
  client,
}: {
  fields: BaserowField[];
  payload: Record<string, unknown>;
  client: BaserowClient;
}): Promise<void> {
  for (const field of fields) {
    if (
      field.type !== BaserowFieldType.SINGLE_SELECT &&
      field.type !== BaserowFieldType.MULTI_SELECT
    ) {
      continue;
    }
    const value = payload[field.name];
    if (value === undefined || value === null || value === '') continue;

    const requested = collectRequestedSelectValues(value);
    if (requested.length === 0) continue;

    const existingValues = new Set(field.select_options.map((o) => o.value));
    const missing = unique(requested.filter((v) => !existingValues.has(v)));
    if (missing.length === 0) continue;

    const result = await tryCatch(() =>
      client.updateFieldSelectOptions({
        fieldId: field.id,
        existingOptions: field.select_options,
        newOptions: missing,
      }),
    );
    if (result.error) {
      console.error(
        `[baserow] Failed to auto-create missing select options for field "${field.name}":`,
        result.error,
      );
    }
  }
}

function linkByKey(fieldName: string): string {
  return `__link_by__${fieldName}`;
}

function isLinkByKey({
  key,
  fieldsByName,
}: {
  key: string;
  fieldsByName: Map<string, BaserowField>;
}): boolean {
  const prefix = linkByKey('');
  if (!key.startsWith(prefix) || fieldsByName.has(key)) return false;
  return fieldsByName.get(key.slice(prefix.length))?.type === BaserowFieldType.LINK_TO_TABLE;
}

function readLinkBy(value: unknown): BaserowLinkBy {
  return value === BaserowLinkBy.PRIMARY_FIELD_VALUE
    ? BaserowLinkBy.PRIMARY_FIELD_VALUE
    : BaserowLinkBy.ROW_ID;
}

function toLinkedRowReferences({
  fieldName,
  value,
  linkBy,
}: {
  fieldName: string;
  value: unknown;
  linkBy: BaserowLinkBy;
}): number[] | string[] {
  const byPrimaryFieldValue = linkBy === BaserowLinkBy.PRIMARY_FIELD_VALUE;
  const items = toFieldItems({ value, objectKey: byPrimaryFieldValue ? 'value' : 'id' });
  if (byPrimaryFieldValue) {
    return items.map((item) => (typeof item === 'string' ? item.trim() : String(item)));
  }
  return items.map((item) => toRowId({ fieldName, item }));
}

function toFieldItems({
  value,
  objectKey,
}: {
  value: unknown;
  objectKey: string;
}): unknown[] {
  return (Array.isArray(value) ? value.flat() : [value])
    .map((item) => unwrapObjectValue({ item, key: objectKey }))
    .filter((item) => !isBlankItem(item));
}

function unwrapObjectValue({ item, key }: { item: unknown; key: string }): unknown {
  if (typeof item !== 'object' || item === null) return item;
  return key in item ? Reflect.get(item, key) : item;
}

function isBlankItem(item: unknown): boolean {
  if (item === null || item === undefined) return true;
  return typeof item === 'string' && item.trim().length === 0;
}

function toRowId({ fieldName, item }: { fieldName: string; item: unknown }): number {
  const rowId = asPositiveInteger(item);
  if (rowId !== undefined) return rowId;
  throw new Error(
    `Field "${fieldName}": "${String(item)}" is not a row ID. To link rows by the value of the linked table's primary field, set "${fieldName} — Link by" to "Primary field value".`
  );
}

function toCollaboratorId({ fieldName, item }: { fieldName: string; item: unknown }): number {
  const userId = asPositiveInteger(item);
  if (userId !== undefined) return userId;
  throw new Error(
    `Field "${fieldName}": "${String(item)}" is not a Baserow user ID. Collaborator fields accept numeric user IDs only — a name or an email cannot be resolved.`
  );
}

function asPositiveInteger(item: unknown): number | undefined {
  const candidate = typeof item === 'string' ? item.trim() : item;
  const parsed = typeof candidate === 'string' && /^\d+$/.test(candidate) ? Number(candidate) : candidate;
  if (typeof parsed === 'number' && Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  return undefined;
}

function toDateOnly(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return match ? match[1] : value;
}

function buildRowLabel({
  row,
  primaryFieldName,
}: {
  row: { id: number } & Record<string, unknown>;
  primaryFieldName: string | undefined;
}): string {
  const primaryValue = primaryFieldName ? row[primaryFieldName] : undefined;
  if (typeof primaryValue === 'number') return `#${row.id} ${primaryValue}`;
  if (typeof primaryValue === 'string' && primaryValue.trim().length > 0) {
    return `#${row.id} ${primaryValue.trim()}`;
  }
  return `Row #${row.id}`;
}

function collectRequestedSelectValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
  }
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
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
        const [tableFields, response] = await Promise.all([
          tryCatch(() => client.listTableFields(table_id)),
          client.listRows(table_id, undefined, 200),
        ]);
        const primaryFieldName = tableFields.data?.find((field) => field.primary)?.name;
        return {
          disabled: false,
          options: response.results.map((row) => ({
            label: buildRowLabel({ row, primaryFieldName }),
            value: row.id,
          })),
        };
      },
    }),
  tableFields: ({ required, withLinkBy }: { required: boolean; withLinkBy: boolean }) =>
    Property.DynamicProperties({
      auth: baserowAuth,
      displayName: 'Table Fields',
      required,
      refreshers: ['table_id'],
      props: async ({ auth, table_id }) => {
        if (!auth || typeof table_id !== 'number') return {};

        const schema = await tryCatch(async () => {
          const client = await makeClient(auth);
          return await client.listTableFields(table_id);
        });
        if (schema.error) {
          return {
            table_fields_error: Property.MarkDown({
              value: `**Could not load this table's fields** — ${schema.error.message}

Check that your Baserow connection still has access to this table, then reselect it above.`,
              variant: MarkdownVariant.WARNING,
            }),
          };
        }

        const fields: DynamicPropsValue = {};
        for (const field of schema.data) {
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
                  description: `Rows of table ${field.link_row_table_id} to link to, as row IDs or primary field values depending on "${field.name} — Link by".`,
                });
                if (!withLinkBy) break;
                fields[linkByKey(field.name)] = Property.StaticDropdown({
                  displayName: `${field.name} — Link by`,
                  description:
                    "**Row ID**: the numeric ID of each linked row. **Primary field value**: the value of the linked table's primary field, compared as text even when it looks like a number.",
                  required: false,
                  defaultValue: BaserowLinkBy.ROW_ID,
                  options: {
                    disabled: false,
                    options: [
                      { label: 'Row ID', value: BaserowLinkBy.ROW_ID },
                      {
                        label: 'Primary field value',
                        value: BaserowLinkBy.PRIMARY_FIELD_VALUE,
                      },
                    ],
                  },
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
        return fields;
      },
    }),
};
