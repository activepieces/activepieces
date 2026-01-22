import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const insertRowAction = createAction({
  auth: oracleDbAuth,
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Insert a row into an Oracle table',
  props: {
    tableName: oracleDbProps.tableName(),
    row: Property.Object({
      displayName: 'Row',
      description: 'Column names and values to insert',
      required: true,
      defaultValue: {
        COLUMN_NAME: 'value',
      },
    }),
  },
  async run(context) {
    const { tableName, row } = context.propsValue;

    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      throw new Error("Row must be a valid object with column names as keys");
    }

    try {
      const client = new OracleDbClient(context.auth.props);
      return await client.insertRow(tableName, row as Record<string, unknown>);
    } catch (error) {
      throw new Error(
        `Failed to insert row into ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
