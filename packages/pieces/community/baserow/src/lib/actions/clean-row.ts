import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, formatFieldValues, makeClient } from '../common';

export const cleanRowAction = createAction({
  name: 'baserow_clean_row',
  displayName: 'Clean Row',
  description:
    'Clears fields in a row. Empty values will clear the corresponding fields.',
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
