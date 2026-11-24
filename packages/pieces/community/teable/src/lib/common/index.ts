import {
  DynamicPropsValue,
  MarkdownVariant,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { TeableAuth, TeableAuthValue } from '../auth';
import { teableClient, TeableField } from './client';
import { TeableComputedFieldTypes, TeableFieldType, TEABLE_MAX_PAGE_SIZE } from './constants';

function errorPlaceholder({ prefix, error }: { prefix: string; error: unknown }): string {
  return `${prefix}: ${error instanceof Error ? error.message : String(error)}`;
}

function isRecordWritableField(field: TeableField): boolean {
  return (
    field.isComputed !== true &&
    !TeableComputedFieldTypes.includes(field.type) &&
    field.type !== TeableFieldType.ATTACHMENT &&
    field.type !== TeableFieldType.BUTTON
  );
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildFieldProp({ field, mode }: { field: TeableField; mode: 'create' | 'update' }) {
  const displayName = field.name;
  const required = false;
  const choices = field.options?.choices ?? [];
  switch (field.type) {
    case TeableFieldType.CHECKBOX:
      if (mode === 'update') {
        return Property.StaticDropdown<boolean>({
          displayName,
          required,
          options: {
            options: [
              { label: 'Checked', value: true },
              { label: 'Unchecked', value: false },
            ],
          },
        });
      }
      return Property.Checkbox({ displayName, required });
    case TeableFieldType.NUMBER:
    case TeableFieldType.RATING:
      return Property.Number({ displayName, required });
    case TeableFieldType.DATE:
      return Property.DateTime({ displayName, required });
    case TeableFieldType.LONG_TEXT:
      return Property.LongText({ displayName, required });
    case TeableFieldType.MULTIPLE_SELECT:
      return Property.StaticMultiSelectDropdown({
        displayName,
        required,
        options: { options: choices.map((c) => ({ label: c.name, value: c.name })) },
      });
    case TeableFieldType.SINGLE_SELECT:
      return Property.StaticDropdown({
        displayName,
        required,
        options: { options: choices.map((c) => ({ label: c.name, value: c.name })) },
      });
    case TeableFieldType.LINK:
      return Property.Array({
        displayName,
        description: 'Record IDs or primary field values of the linked records.',
        required,
      });
    case TeableFieldType.USER:
      return Property.Array({
        displayName,
        description: 'User names, emails, or IDs.',
        required,
      });
    default:
      return Property.ShortText({ displayName, required });
  }
}

async function loadRecordFieldProps({
  auth,
  tableId,
  mode,
}: {
  auth: TeableAuthValue | undefined;
  tableId: unknown;
  mode: 'create' | 'update';
}): Promise<DynamicPropsValue> {
  if (!auth || !tableId) {
    return {};
  }
  const { data: fields, error } = await tryCatch(() =>
    teableClient.listFields({ auth, tableId: String(tableId) }),
  );
  if (error) {
    return {
      load_error: Property.MarkDown({
        value: "Could not load this table's fields. Check the connection and pick the table again.",
        variant: MarkdownVariant.WARNING,
      }),
    };
  }
  const props: DynamicPropsValue = {};
  for (const field of fields) {
    if (isRecordWritableField(field)) {
      props[field.name] = buildFieldProp({ field, mode });
    }
  }
  return props;
}

function baseDropdown({ width }: { width: 'half' | undefined }) {
  return Property.Dropdown({
    auth: TeableAuth,
    displayName: 'Base',
    description: 'The Teable base that holds your table.',
    required: true,
    width,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect first.' };
      }
      try {
        const bases = await teableClient.listBases({ auth });
        return {
          disabled: false,
          options: bases.map((b) => ({ label: b.name, value: b.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: errorPlaceholder({ prefix: 'Error loading bases', error }),
        };
      }
    },
  });
}

export const TeableCommon = {
  base_id: baseDropdown({ width: 'half' }),
  base_id_full: baseDropdown({ width: undefined }),
  table_id: Property.Dropdown({
    auth: TeableAuth,
    displayName: 'Table',
    description: 'The table inside the selected base.',
    required: true,
    width: 'half',
    refreshers: ['base_id'],
    options: async ({ auth, base_id }) => {
      if (!auth || !base_id) {
        return { disabled: true, options: [], placeholder: 'Pick a base.' };
      }
      try {
        const tables = await teableClient.listTables({ auth, baseId: String(base_id) });
        return {
          disabled: false,
          options: tables.map((t) => ({ label: t.name, value: t.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: errorPlaceholder({ prefix: 'Error loading tables', error }),
        };
      }
    },
  }),
  record_id: Property.Dropdown({
    auth: TeableAuth,
    displayName: 'Record',
    description: 'Lists the first 1000 records. Map a record ID for larger tables.',
    required: true,
    refreshers: ['table_id'],
    options: async ({ auth, table_id }) => {
      if (!auth || !table_id) {
        return { disabled: true, options: [], placeholder: 'Select a table first.' };
      }
      try {
        const response = await teableClient.listRecords({
          auth,
          tableId: String(table_id),
          query: { take: TEABLE_MAX_PAGE_SIZE },
        });
        return {
          disabled: false,
          options: response.records.map((r) => ({
            label: typeof r.name === 'string' && r.name.length > 0 ? r.name : r.id,
            value: r.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: errorPlaceholder({ prefix: 'Error loading records', error }),
        };
      }
    },
  }),
  view_id: Property.Dropdown({
    auth: TeableAuth,
    displayName: 'View',
    description: 'Only return records visible in this view.',
    required: false,
    refreshers: ['table_id'],
    options: async ({ auth, table_id }) => {
      if (!auth || !table_id) {
        return { disabled: true, options: [], placeholder: 'Select a table first.' };
      }
      try {
        const views = await teableClient.listViews({ auth, tableId: String(table_id) });
        return {
          disabled: false,
          options: views.map((v) => ({ label: `${v.name} (${capitalizeFirst(v.type)})`, value: v.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: errorPlaceholder({ prefix: 'Error loading views', error }),
        };
      }
    },
  }),
  fields: Property.DynamicProperties({
    auth: TeableAuth,
    displayName: 'Fields',
    description: 'Values to save. One input per field you can edit.',
    required: true,
    refreshers: ['auth', 'table_id'],
    props: async ({ auth, table_id }) =>
      loadRecordFieldProps({ auth, tableId: table_id, mode: 'create' }),
  }),
  update_fields: Property.DynamicProperties({
    auth: TeableAuth,
    displayName: 'Fields',
    description: 'Values to change. One input per field you can edit.',
    required: false,
    refreshers: ['auth', 'table_id'],
    props: async ({ auth, table_id }) =>
      loadRecordFieldProps({ auth, tableId: table_id, mode: 'update' }),
  }),
  fields_to_clear: Property.MultiSelectDropdown({
    auth: TeableAuth,
    displayName: 'Fields to Clear',
    description: 'Fields to empty on the record.',
    required: false,
    refreshers: ['table_id'],
    options: async ({ auth, table_id }) => {
      if (!auth || !table_id) {
        return { disabled: true, options: [], placeholder: 'Select a table first.' };
      }
      try {
        const fields = await teableClient.listFields({ auth, tableId: String(table_id) });
        return {
          disabled: false,
          options: fields
            .filter((f) => isRecordWritableField(f) || f.type === TeableFieldType.ATTACHMENT)
            .map((f) => ({ label: f.name, value: f.name })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: errorPlaceholder({ prefix: 'Error loading fields', error }),
        };
      }
    },
  }),
  attachment_field_id: Property.Dropdown({
    auth: TeableAuth,
    displayName: 'Attachment Field',
    description: 'The attachment field to upload the file to.',
    required: true,
    refreshers: ['table_id'],
    options: async ({ auth, table_id }) => {
      if (!auth || !table_id) {
        return { disabled: true, options: [], placeholder: 'Select a table first.' };
      }
      try {
        const fields = await teableClient.listFields({ auth, tableId: String(table_id) });
        const attachmentFields = fields.filter((f) => f.type === TeableFieldType.ATTACHMENT);
        if (attachmentFields.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This table has no attachment fields.',
          };
        }
        return {
          disabled: false,
          options: attachmentFields.map((f) => ({ label: f.name, value: f.id })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: errorPlaceholder({ prefix: 'Error loading fields', error }),
        };
      }
    },
  }),
};

export const TeableAgentProps = {
  base_id: Property.ShortText({
    displayName: 'Base ID',
    description: 'The Teable base ID. Get it from List Bases.',
    required: true,
  }),
  table: Property.ShortText({
    displayName: 'Table (name or ID)',
    description: 'The table name or table ID. Get both from Get Base Schema (Agent).',
    required: true,
  }),
  record_id: Property.ShortText({
    displayName: 'Record ID',
    description: 'The ID of the record, e.g. from Search Records (Agent).',
    required: true,
  }),
  fields: Property.Json({
    displayName: 'Fields',
    description:
      'A JSON object keyed by field name or field ID, e.g. {"Name": "Jane", "Age": 30, "Status": "Open"}. Select fields take the option name; link and user fields take names or IDs.',
    required: true,
  }),
};

export const teableProps = {
  isRecordWritableField,
};

export { TeableFieldType, TeableComputedFieldTypes };
