import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, formatFieldValues, makeClient } from '../common';

export const cleanRowAction = createAction({
  name: 'baserow_clean_row',
  displayName: 'Clean Row',
  description:
    'Sets all fields in a row to empty/null. To update only specific fields, use Update Row instead.',
  audience: 'both',
  aiMetadata: {
    description:
      'Clears the supplied fields on one existing Baserow row (identified by row ID) to empty/null, including blank values that Update Row would skip. Use specifically to wipe field contents rather than set new values; to change only some fields to new values use Update Row. Idempotent: re-clearing the same row leaves it in the same empty state.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
    table_fields: baserowCommon.tableFields(true),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue as {
      table_id: number;
      row_id: number;
    };
    const tableFieldsInput = context.propsValue.table_fields!;

    const client = await makeClient(context.auth);
    const tableSchema = await client.listTableFields(table_id);

    const fieldTypeMap: Record<string, string> = {};
    for (const column of tableSchema) {
      fieldTypeMap[column.name] = column.type;
    }

    const formattedFields = formatFieldValues(tableFieldsInput, fieldTypeMap, {
      skipEmpty: false,
    });
    return await client.updateRow(table_id, row_id, formattedFields);
  },
});
