import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const deleteRowAction = createAction({
  auth: oracleDbAuth,
  name: 'delete_row',
  displayName: 'Delete Row',
  description: 'Delete rows from an Oracle table',
  props: {
    tableName: oracleDbProps.tableName(),
    filter: Property.Object({
      displayName: 'Filter (WHERE)',
      description: 'Conditions to match rows for deletion',
      required: true,
      defaultValue: { ID: 101 },
    }),
  },
  async run(context) {
    const { tableName, filter } = context.propsValue;

    if (
      typeof filter !== 'object' ||
      filter === null ||
      Array.isArray(filter)
    ) {
      throw new Error('Filter must be a valid object');
    }

    if (Object.keys(filter).length === 0) {
      throw new Error(
        'Filter cannot be empty. Use Run Custom SQL action to delete all rows.'
      );
    }

    try {
      const client = new OracleDbClient(context.auth.props);
      return await client.deleteRow(tableName, filter as Record<string, unknown>);
    } catch (error) {
      throw new Error(
        `Failed to delete rows from ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
