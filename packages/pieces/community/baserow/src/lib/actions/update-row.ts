import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import {
  baserowCommon,
  ensureSelectOptionsExist,
  formatFieldValues,
  makeClient,
} from '../common';

export const updateRowAction = createAction({
  name: 'baserow_update_row',
  displayName: 'Update Row',
  description:
    'Updates fields in an existing row. Empty values are skipped. To clear a field, use Clean Row.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates field values on one existing Baserow row identified by its numeric row ID. Only the fields you supply are changed and empty values are skipped, so it cannot clear a field — use Clean Row for that. Requires a known row ID (resolve one first with Find Row or List Rows if needed). Optionally auto-creates missing single/multi-select options. Idempotent: applying the same values to the same row leaves it in the same state.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
    table_fields: baserowCommon.tableFields(true),
    create_missing_select_options: Property.Checkbox({
      displayName: 'Create missing select options',
      description:
        'When enabled, single/multi-select values that do not yet exist in the field will be added before updating the row. Existing options are preserved.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
    const row_id = context.propsValue.row_id!;
    const tableFieldsInput = context.propsValue.table_fields!;
    const createMissingSelectOptions = context.propsValue.create_missing_select_options ?? false;

    const client = await makeClient(context.auth);
    const tableSchema = await client.listTableFields(table_id);

    const fieldTypeMap: Record<string, string> = {};
    for (const column of tableSchema) {
      fieldTypeMap[column.name] = column.type;
    }

    const formattedFields = formatFieldValues(tableFieldsInput, fieldTypeMap, {
      skipEmpty: true,
    });

    if (createMissingSelectOptions) {
      await ensureSelectOptionsExist({
        fields: tableSchema,
        payload: formattedFields,
        client,
      });
    }

    return await client.updateRow(table_id, row_id, formattedFields);
  },
});
