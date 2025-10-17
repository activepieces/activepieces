import { createAction } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const deleteRowAction = createAction({
  auth: oracleDbAuth,
  name: 'delete_row',
  displayName: 'Delete Row',
  description:
    'Delete one or more rows in a table that match the filter conditions.',
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
        "A filter condition is required to prevent accidental deletion of all rows. To delete all rows, please use the 'Run Custom SQL' action with a 'DELETE FROM table' or 'TRUNCATE TABLE table' statement."
      );
    }

    return await client.deleteRow(tableName, filter as Record<string, unknown>);
  },
});
