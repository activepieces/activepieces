import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, formatFieldValues, makeClient } from '../common';

export const createRowAction = createAction({
  name: 'baserow_create_row',
  displayName: 'Create Row',
  description: 'Creates a new row.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    table_fields: baserowCommon.tableFields(true),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
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
    return await client.createRow(table_id, formattedFields);
  },
});
