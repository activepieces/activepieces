import { createAction } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const insertRowsAction = createAction({
  auth: oracleDbAuth,
  name: 'insert_rows',
  displayName: 'Insert Rows',
  description: 'Insert a batch of rows into a table.',
  props: {
    tableName: oracleDbProps.tableName(),
    rows: oracleDbProps.rows(), 
  },
  async run(context) {
    const { tableName, rows } = context.propsValue;
    const client = new OracleDbClient(context.auth);

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(
        "The 'Rows' property must be a non-empty array of objects."
      );
    }

    return await client.insertRows(
      tableName,
      rows as Record<string, unknown>[]
    );
  },
});
