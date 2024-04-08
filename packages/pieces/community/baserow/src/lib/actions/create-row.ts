import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../..';
import { baserowCommon, makeClient } from '../common';
import { BaserowFieldType } from '../common/constants';

export const createRowAction = createAction({
  name: 'baserow_create_row',
  displayName: 'Create Row',
  description: 'Creates a new row.',
  auth: baserowAuth,
  props: {
    table_id: Property.Number({
      displayName: 'Table ID',
      required: true,
      description:
        "Please enter the table ID where the row must be created in. You can find the ID by clicking on the three dots next to the table. It's the number between brackets.",
    }),
    table_fields: baserowCommon.tableFields(true),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
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

    return await client.createRow(table_id, formattedTableFields);
  },
});
