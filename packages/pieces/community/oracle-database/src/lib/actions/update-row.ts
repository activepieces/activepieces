import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const updateRowAction = createAction({
  auth: oracleDbAuth,
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Update rows in an Oracle table',
  props: {
    tableName: oracleDbProps.tableName(),
    values: Property.Object({
      displayName: 'Values',
      description: 'Column names and new values to set',
      required: true,
      defaultValue: { SALARY: 8000 },
    }),
    filter: Property.Object({
      displayName: 'Filter (WHERE)',
      description: 'Conditions to match rows. Empty object updates ALL rows.',
      required: true,
      defaultValue: { ID: 101 },
    }),
  },
  async run(context) {
    const { tableName, values, filter } = context.propsValue;

    if (
      typeof values !== 'object' ||
      values === null ||
      Array.isArray(values) ||
      Object.keys(values).length === 0
    ) {
      throw new Error('Values must be a non-empty object');
    }
    if (
      typeof filter !== 'object' ||
      filter === null ||
      Array.isArray(filter)
    ) {
      throw new Error('Filter must be a valid object');
    }

    try {
      const client = new OracleDbClient(context.auth.props);
      return await client.updateRow(
        tableName,
        values as Record<string, unknown>,
        filter as Record<string, unknown>
      );
    } catch (error) {
      throw new Error(
        `Failed to update rows in ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
