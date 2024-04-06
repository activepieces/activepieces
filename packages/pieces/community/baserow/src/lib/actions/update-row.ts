import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../..';
import { baserowCommon, makeClient } from '../common';
import { BaserowFieldType } from '../common/constants';

export const updateRowAction = createAction({
  name: 'baserow_update_row',
  displayName: 'Update Row',
  description: 'Updates an existing row.',
  auth: baserowAuth,
  props: {
    table_id: Property.Number({
      displayName: 'Table ID',
      required: true,
      description:
        "Please enter the table ID where the row must be updated in. You can find the ID by clicking on the three dots next to the table. It's the number between brackets.",
    }),
    row_id: Property.Number({
      displayName: 'Row ID',
      required: true,
      description: 'Please enter the row ID that needs to be updated.',
    }),
    table_fields: baserowCommon.tableFields(true),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue;
    const tableFieldsInput = context.propsValue.table_fields!;
    const formattedTableFields: DynamicPropsValue = {};

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof baserowAuth>
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
    return await client.updateRow(table_id, row_id, formattedTableFields);
  },
});
