import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { BaserowFieldType } from '../common/constants';

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
      const fieldType: string = fieldIDTypeMap[key];
      if (fieldType === BaserowFieldType.LINK_TO_TABLE) {
        formattedTableFields[key] = tableFieldsInput[key].map((id: string) =>
          parseInt(id, 10)
        );
      } else if (fieldType === BaserowFieldType.MULTIPLE_COLLABORATORS) {
        formattedTableFields[key] = tableFieldsInput[key].map((id: string) => ({
          id: parseInt(id, 10),
        }));
      } else {
        formattedTableFields[key] = tableFieldsInput[key];
      }
    });

    return await client.createRow(table_id, formattedTableFields);
  },
});
