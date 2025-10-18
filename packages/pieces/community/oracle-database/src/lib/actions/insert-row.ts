import { createAction } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const insertRowAction = createAction({
  auth: oracleDbAuth,
  name: 'insert_row',
  displayName: 'Insert Row',
  description: 'Insert a single row into a table.',
  props: {
    tableName: oracleDbProps.tableName(),
    row: oracleDbProps.row(),
  },
  async run(context) {
    const { tableName, row } = context.propsValue;
    const client = new OracleDbClient(context.auth);

    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      throw new Error("The 'Row' property must be a valid JSON object.");
    }

    return await client.insertRow(tableName, row as Record<string, unknown>);
  },
});
