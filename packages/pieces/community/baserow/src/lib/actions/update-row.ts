import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, formatFieldValues, makeClient } from '../common';

export const updateRowAction = createAction({
  name: 'baserow_update_row',
  displayName: 'Update Row',
  description:
    'Updates fields in an existing row. Empty values are skipped. To clear a field, use Clean Row.',
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
      skipEmpty: true,
    });
    return await client.updateRow(table_id, row_id, formattedFields);
  },
});
