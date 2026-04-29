import {
  Property,
  createAction,
  DropdownState,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import {
  baserowCommon,
  ensureSelectOptionsExist,
  formatFieldValues,
  makeClient,
} from '../common';
import { BaserowFieldType } from '../common/constants';

export const upsertRowAction = createAction({
  name: 'baserow_upsert_row',
  displayName: 'Upsert Row',
  description:
    'Creates a new row or updates an existing one by matching a field value.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    match_field: Property.Dropdown({
      displayName: 'Match Field',
      description: 'Select the field to search for an existing row.',
      required: true,
      auth: baserowAuth,
      refreshers: ['auth', 'table_id'],
      options: async ({ auth, table_id }): Promise<DropdownState<string>> => {
        if (!auth || typeof table_id !== 'number') {
          return {
            disabled: true,
            placeholder: 'Select a table first.',
            options: [],
          };
        }
        const client = await makeClient(auth);
        const fields = await client.listTableFields(table_id);
        const unsupportedTypes: string[] = [
          BaserowFieldType.LINK_TO_TABLE,
          BaserowFieldType.MULTI_SELECT,
          BaserowFieldType.MULTIPLE_COLLABORATORS,
          BaserowFieldType.FILE,
          BaserowFieldType.ROLLUP,
          BaserowFieldType.LOOKUP,
          BaserowFieldType.COUNT,
          BaserowFieldType.LAST_MODIFIED_BY,
          BaserowFieldType.CREATED_BY,
          BaserowFieldType.DATE,
          BaserowFieldType.LAST_MODIFIED,
          BaserowFieldType.CREATED_ON,
          BaserowFieldType.DURATION,
          BaserowFieldType.UUID,
          BaserowFieldType.AUTO_NUMBER,
        ];
        return {
          disabled: false,
          options: fields
            .filter((f) => !f.read_only && !unsupportedTypes.includes(f.type))
            .map((f) => ({ label: f.name, value: `field_${f.id}` })),
        };
      },
    }),
    match_value: Property.ShortText({
      displayName: 'Match Value',
      description:
        'The value to search for (exact match). If a row with this value is found it will be updated; otherwise a new row is created.',
      required: true,
    }),
    table_fields: baserowCommon.tableFields(true),
    create_missing_select_options: Property.Checkbox({
      displayName: 'Create missing select options',
      description:
        'When enabled, single/multi-select values that do not yet exist in the field will be added before creating or updating the row. Existing options are preserved.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table_id, match_field, match_value, table_fields, create_missing_select_options } =
      context.propsValue;

    const client = await makeClient(context.auth);
    const tableSchema = await client.listTableFields(table_id!);

    const fieldTypeMap: Record<string, string> = {};
    for (const column of tableSchema) {
      fieldTypeMap[column.name] = column.type;
    }

    const formattedFields = formatFieldValues(table_fields!, fieldTypeMap, {
      skipEmpty: true,
    });

    const existing = (await client.listRows(
      table_id!,
      undefined,
      1,
      undefined,
      undefined,
      { [`filter__${match_field}__equal`]: match_value! }
    )) as { results: Record<string, unknown>[]; count: number };

    if (existing.results.length > 0) {
      if (create_missing_select_options) {
        await ensureSelectOptionsExist({
          fields: tableSchema,
          payload: formattedFields,
          client,
        });
      }
      const rowId = existing.results[0]['id'] as number;
      const updated = await client.updateRow(table_id!, rowId, formattedFields);
      return { action: 'updated', row: updated };
    }

    // Inject the match field into the new row so the upsert is idempotent.
    // Done before ensureSelectOptionsExist so a SINGLE_SELECT match value
    // gets auto-created when the toggle is enabled.
    const matchFieldId = parseInt(match_field!.replace('field_', ''), 10);
    const matchFieldDef = tableSchema.find((f) => f.id === matchFieldId);
    if (matchFieldDef) {
      formattedFields[matchFieldDef.name] = coerceMatchValue({
        value: match_value!,
        fieldType: matchFieldDef.type,
      });
    }

    if (create_missing_select_options) {
      await ensureSelectOptionsExist({
        fields: tableSchema,
        payload: formattedFields,
        client,
      });
    }

    const created = await client.createRow(table_id!, formattedFields);
    return { action: 'created', row: created };
  },
});

function coerceMatchValue({
  value,
  fieldType,
}: {
  value: string;
  fieldType: string;
}): unknown {
  switch (fieldType) {
    case BaserowFieldType.BOOLEAN: {
      const normalized = value.trim().toLowerCase();
      return ['true', '1', 'yes'].includes(normalized);
    }
    case BaserowFieldType.NUMBER:
    case BaserowFieldType.RATING: {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new Error(
          `Match Value "${value}" is not a valid number for the selected ${fieldType} field.`
        );
      }
      return parsed;
    }
    default:
      return value;
  }
}
