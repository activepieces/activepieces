import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const insertRowsAction = createAction({
  auth: oracleDbAuth,
  name: 'insert_rows',
  displayName: 'Insert Rows',
  description: 'Insert multiple rows into an Oracle table',
  props: {
    tableName: oracleDbProps.tableName(),
    rows: Property.Array({
      displayName: 'Rows',
      description: 'Array of objects with column names and values',
      required: true,
      defaultValue: [
        { COLUMN_1: 'value_a', COLUMN_2: 1 },
        { COLUMN_1: 'value_b', COLUMN_2: 2 },
      ],
    }),
  },
  async run(context) {
    const { tableName, rows } = context.propsValue;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Rows must be a non-empty array of objects');
    }

    try {
      const client = new OracleDbClient(context.auth.props);
      return await client.insertRows(
        tableName,
        rows as Record<string, unknown>[]
      );
    } catch (error) {
      throw new Error(
        `Failed to insert rows into ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
