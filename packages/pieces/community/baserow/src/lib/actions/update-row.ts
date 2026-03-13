import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { BaserowFieldType } from '../common/constants';

export const updateRowAction = createAction({
  name: 'baserow_update_row',
  displayName: 'Update Row',
  description: 'Updates an existing row.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
    table_fields: baserowCommon.tableFields(true),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue as {table_id: number, row_id: number};
    const tableFieldsInput = context.propsValue.table_fields!;
    const formattedTableFields: DynamicPropsValue = {};

    const client = makeClient(
      context.auth.props
    );
    const tableSchema = await client.listTableFields(table_id);

    // transform props value to related baserow value
    const fieldIDTypeMap: { [key: string]: string } = {};
    for (const column of tableSchema) {
      fieldIDTypeMap[column.name] = column.type;
    }

    Object.keys(tableFieldsInput).forEach((key) => {
      const value = tableFieldsInput[key];
      if (value === null || value === undefined) {
        return;
      }
      const fieldType: string = fieldIDTypeMap[key];
      if (fieldType === BaserowFieldType.LINK_TO_TABLE) {
        formattedTableFields[key] = (value as string[]).map((id: string) =>
          parseInt(id, 10)
        );
      } else if (fieldType === BaserowFieldType.MULTIPLE_COLLABORATORS) {
        formattedTableFields[key] = (value as string[]).map((id: string) => ({
          id: parseInt(id, 10),
        }));
      } else {
        formattedTableFields[key] = value;
      }
    });
    return await client.updateRow(table_id, row_id, formattedTableFields);
  },
});
