import { createAction } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const findRowAction = createAction({
  auth: oracleDbAuth,
  name: 'find_row',
  displayName: 'Find Row',
  description: 'Finds one or more rows in a table based on filter conditions.',
  props: {
    tableName: oracleDbProps.tableName(),
    filter: oracleDbProps.filter(),
  },
  async run(context) {
    const { tableName, filter } = context.propsValue;
    const client = new OracleDbClient(context.auth);

    if (
      typeof filter !== 'object' ||
      filter === null ||
      Array.isArray(filter)
    ) {
      throw new Error(
        "The 'Filter Conditions' property must be a valid JSON object."
      );
    }

    if (Object.keys(filter).length === 0) {
      throw new Error(
        "A filter condition is required to prevent fetching an entire table. To fetch all rows, please use the 'Run Custom SQL' action with a 'SELECT * FROM table' statement."
      );
    }

    const result = await client.findRow(
      tableName,
      filter as Record<string, unknown>
    );

    return result.rows;
  },
});
