import { createAction } from '@activepieces/pieces-framework';
import { oracleDbAuth } from '../common/auth';
import { OracleDbClient } from '../common/client';
import { oracleDbProps } from '../common/props';

export const updateRowAction = createAction({
  auth: oracleDbAuth,
  name: 'update_row',
  displayName: 'Update Row',
  description:
    'Update one or more rows in a table that match the filter conditions.',
  props: {
    tableName: oracleDbProps.tableName(),
    values: oracleDbProps.values(),
    filter: oracleDbProps.filter(),
  },
  async run(context) {
    const { tableName, values, filter } = context.propsValue;
    const client = new OracleDbClient(context.auth);

    if (
      typeof values !== 'object' ||
      values === null ||
      Array.isArray(values) ||
      Object.keys(values).length === 0
    ) {
      throw new Error(
        "The 'Values to Update' property must be a non-empty JSON object."
      );
    }
    if (
      typeof filter !== 'object' ||
      filter === null ||
      Array.isArray(filter)
    ) {
      throw new Error(
        "The 'Filter Conditions' property must be a valid JSON object."
      );
    }

    return await client.updateRow(
      tableName,
      values as Record<string, unknown>,
      filter as Record<string, unknown>
    );
  },
});
