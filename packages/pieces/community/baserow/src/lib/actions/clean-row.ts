import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { BaserowFieldType } from '../common/constants';

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
    const formattedTableFields: DynamicPropsValue = {};

    const client = makeClient(context.auth.props);
    const tableSchema = await client.listTableFields(table_id);

    const fieldIDTypeMap: { [key: string]: string } = {};
    for (const column of tableSchema) {
      fieldIDTypeMap[column.name] = column.type;
    }

    Object.keys(tableFieldsInput).forEach((key) => {
      const value = tableFieldsInput[key];
      const fieldType: string = fieldIDTypeMap[key];
      if (fieldType === BaserowFieldType.LINK_TO_TABLE) {
        if (Array.isArray(value) && value.length > 0) {
          formattedTableFields[key] = value.map((id: string) =>
            parseInt(id, 10)
          );
        } else {
          formattedTableFields[key] = [];
        }
      } else if (fieldType === BaserowFieldType.MULTIPLE_COLLABORATORS) {
        if (Array.isArray(value) && value.length > 0) {
          formattedTableFields[key] = value.map((id: string) => ({
            id: parseInt(id, 10),
          }));
        } else {
          formattedTableFields[key] = [];
        }
      } else if (
        fieldType === BaserowFieldType.SINGLE_SELECT ||
        fieldType === BaserowFieldType.MULTI_SELECT
      ) {
        if (value === null || value === undefined || value === '') {
          formattedTableFields[key] = fieldType === BaserowFieldType.MULTI_SELECT ? [] : null;
        } else {
          formattedTableFields[key] = value;
        }
      } else {
        if (value === null || value === undefined) {
          formattedTableFields[key] = null;
        } else {
          formattedTableFields[key] = value;
        }
      }
    });
    return await client.updateRow(table_id, row_id, formattedTableFields);
  },
});
